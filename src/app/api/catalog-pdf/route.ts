import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";

/**
 * Optimize Cloudinary image URLs by inserting transformation parameters.
 * Limits width to 600px and quality to 60% for smaller downloads in PDF.
 */
function optimizeCloudinaryUrl(url: string): string {
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/c_limit,w_300,q_40/");
  }
  return url;
}

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "Consultar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function applyMarkup(value: number | null, markup: number): number | null {
  if (value === null) return null;
  return Math.round(value * (1 + markup / 100));
}

async function launchBrowser() {
  // In production/cloud, use @sparticuz/chromium
  // Locally, try to find system Chrome
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.RENDER === "true";

  if (isProduction) {
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  // Local development: find system Chrome
  const localChrome = findLocalChrome();
  return puppeteerCore.launch({
    headless: true,
    executablePath: localChrome,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
}

function findLocalChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA &&
      `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
    // Linux paths (for Docker/CI)
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error("Chrome not found locally. Set CHROME_PATH env var.");
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.RENDER === "true";

    // Fetch all data from DB
    const [artists, settingsRow] = await Promise.all([
      prisma.artist.findMany({
        include: { works: true },
        orderBy: { name: "asc" },
      }),
      prisma.settings.findUnique({ where: { id: "global" } }),
    ]);

    const markupPercentage = settingsRow?.markupPercentage ?? 30;
    const cssFilterValue = "none";

    const totalWorks = artists.reduce((sum, a) => sum + a.works.length, 0);

    // Resolve image URL — in production use Cloudinary URL directly
    // (the user's browser loads them); locally use optimized URLs for Puppeteer
    function resolveImage(img: string): string {
      // Base64 data URIs work inline — return as-is
      if (img.startsWith("data:")) return img;
      const url = img.startsWith("http") ? img : `${origin}${img}`;
      return isProduction ? url : optimizeCloudinaryUrl(url);
    }

    // Build TOC rows
    const tocRows = artists
      .map((a, i) => {
        const pageNum = i + 3;
        return `<tr><td class="toc-name">${esc(a.name)}</td><td class="toc-dots"></td><td class="toc-page">${String(pageNum).padStart(2, "0")}</td></tr>`;
      })
      .join("\n");

    // Build artist pages
    const artistPages = artists
      .map((artist) => {
        const tags = artist.characteristics
          .map((c) => `<span class="tag">${esc(c)}</span>`)
          .join("");

        const buildInfo = (work: (typeof artist.works)[number]) => {
          const displayTitle =
            work.title === "Sem titulo" ? "-" : esc(work.title);
          const price = formatBRL(applyMarkup(work.value, markupPercentage));
          return `<div class="gallery-info">
          <p class="info-title">${displayTitle}</p>
          <p class="info-technique"><span class="info-label">Tecnica:</span> ${esc(work.technique)}</p>
          <p class="info-dimensions"><span class="info-label">Dimensoes:</span> ${esc(work.size)}</p>
          <p class="info-price"><span class="info-label">Valor:</span> ${price}</p>
        </div>`;
        };

        // Group all images per work, show info ONCE below all images
        const figures = artist.works
          .map((work) => {
            const images = work.images || [];
            const info = buildInfo(work);

            if (images.length > 0) {
              const imagesHtml = images
                .map((img) => {
                  const imgUrl = resolveImage(img);
                  return `<img src="${imgUrl}" class="gallery-img" />`;
                })
                .join("\n");

              return `<div class="gallery-figure">
        <div class="gallery-images">${imagesHtml}</div>
        ${info}
      </div>`;
            }
            return `<div class="gallery-figure gallery-figure--text-only">${info}</div>`;
          })
          .join("\n");

        const worksContent =
          artist.works.length === 0
            ? `<p class="no-works">sem obras cadastradas</p>`
            : `<div class="gallery">${figures}</div>`;

        return `
        <div class="artist-page">
          <div class="yellow-bar"></div>
          <h2 class="artist-name">${esc(artist.name)}</h2>
          <div class="tags">${tags}</div>
          ${worksContent}
          <div class="yellow-line-bottom"></div>
        </div>`;
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Art on the Wall - Catalogo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #000;
      color: #B8AFA6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ---- Cover ---- */
    .cover {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      padding: 60px 40px;
    }
    .cover h1 {
      font-size: 56px;
      font-weight: 900;
      letter-spacing: 8px;
      margin-bottom: 16px;
    }
    .cover .subtitle {
      font-size: 18px;
      font-weight: 400;
      color: #ccc;
      margin-bottom: 32px;
    }
    .cover .yellow-divider {
      width: 120px;
      height: 4px;
      background: #FFE600;
      margin: 0 auto 32px;
    }
    .cover .catalog-label {
      font-size: 14px;
      font-weight: 600;
      color: #FFE600;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    /* ---- TOC ---- */
    .toc {
      page-break-after: always;
      padding: 60px 50px;
      min-height: 100vh;
    }
    .toc h2 {
      font-size: 36px;
      font-weight: 900;
      color: #FFE600;
      margin-bottom: 8px;
      text-transform: none;
    }
    .toc .stats {
      font-size: 14px;
      color: #888;
      margin-bottom: 32px;
    }
    .toc table {
      width: 100%;
      border-collapse: collapse;
    }
    .toc-name {
      font-weight: 600;
      font-size: 18px;
      padding: 8px 0;
      white-space: nowrap;
    }
    .toc-dots {
      width: 100%;
      border-bottom: 1px dotted #333;
      padding: 8px 8px;
    }
    .toc-page {
      font-weight: 700;
      font-size: 18px;
      color: #FFE600;
      padding: 8px 0;
      text-align: right;
      white-space: nowrap;
    }

    /* ---- Artist pages ---- */
    .artist-page {
      page-break-before: always;
      padding: 0 50px 40px;
      min-height: 100vh;
      position: relative;
    }
    .yellow-bar {
      width: 100%;
      height: 6px;
      background: #FFE600;
      margin-bottom: 24px;
    }
    .artist-name {
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .tag {
      background: #1a1a1a;
      color: #FFE600;
      font-size: 14px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 20px;
    }

    /* ---- Image Gallery ---- */
    .gallery {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 16px;
    }
    .gallery-figure {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      page-break-inside: avoid;
    }
    .gallery-figure--text-only {
      background: #111;
      border-radius: 6px;
      padding: 12px;
      justify-content: center;
      min-height: 80px;
    }
    .gallery-images {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      width: 100%;
    }
    .gallery-images .gallery-img {
      max-width: 340px;
      flex: 1 1 auto;
    }
    .gallery-img {
      width: 100%;
      max-width: 700px;
      object-fit: contain;
      border-radius: 6px;
      border: 2px solid #222;
      filter: ${cssFilterValue};
    }
    .gallery-info {
      width: 100%;
      padding: 8px 2px 4px;
      text-align: center;
    }
    .info-title {
      font-size: 18px;
      font-weight: 700;
      color: #B8AFA6;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .info-label {
      font-weight: 700;
      color: #ccc;
    }
    .info-technique {
      font-size: 14px;
      font-style: italic;
      color: #999;
      line-height: 1.4;
      margin-bottom: 3px;
    }
    .info-dimensions {
      font-size: 14px;
      color: #999;
      line-height: 1.4;
      margin-bottom: 3px;
    }
    .info-price {
      font-size: 16px;
      font-weight: 700;
      color: #FFE600;
      line-height: 1.4;
      margin-bottom: 3px;
    }
    .no-works {
      color: #555;
      font-style: italic;
      font-size: 14px;
      margin-top: 16px;
    }
    .work-list {
      margin-bottom: 16px;
    }
    .work-list-item {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      border-bottom: 1px solid #1a1a1a;
    }
    .work-list-item .info-title {
      text-align: left;
    }
    .work-list-item .info-detail {
      text-align: left;
    }
    .yellow-line-bottom {
      width: 60px;
      height: 3px;
      background: #FFE600;
      margin-top: auto;
      position: absolute;
      bottom: 40px;
    }

    /* ---- Credits ---- */
    .credits {
      page-break-before: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px 50px;
    }
    .credits h2 {
      font-size: 32px;
      font-weight: 900;
      margin-bottom: 12px;
    }
    .credits .credits-sub {
      font-size: 16px;
      color: #ccc;
      margin-bottom: 32px;
    }
    .credits .credits-note {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }

    /* ---- Print-specific ---- */
    @media print {
      body { background: #000 !important; }
      .cover, .toc, .artist-page, .credits {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <!-- Page 1: Cover -->
  <div class="cover">
    <div class="catalog-label">Catalogo Digital</div>
    <h1>ART ON THE WALL</h1>
    <p class="subtitle">Expo Coletiva Art on The Wall</p>
    <div class="yellow-divider"></div>
  </div>

  <!-- Page 2: TOC -->
  <div class="toc">
    <h2>artistas</h2>
    <p class="stats">${artists.length} Artistas &bull; ${totalWorks} Obras</p>
    <table>
      ${tocRows}
    </table>
  </div>

  <!-- Artist pages -->
  ${artistPages}

  <!-- Credits page -->
  <div class="credits">
    <h2>Art on the Wall</h2>
    <p class="credits-sub">Expo Coletiva Art on The Wall</p>
    <p class="credits-note">Catalogo gerado digitalmente</p>
  </div>

</body>
</html>`;

    // In production (Render): return HTML directly — user's browser renders
    // images from Cloudinary and can print-to-PDF via window.print()
    if (isProduction) {
      const printHtml = html.replace(
        "</body>",
        '<script>window.onload=function(){window.print();};</script></body>',
      );
      return new NextResponse(printHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Local development: use Puppeteer for direct PDF download
    try {
      const browser = await launchBrowser();
      try {
        const page = await browser.newPage();
        await page.setContent(html, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });

        return new NextResponse(Buffer.from(pdfBuffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="catalogo-art-on-the-wall.pdf"',
          },
        });
      } finally {
        await browser.close();
      }
    } catch (pdfError: any) {
      console.error("Puppeteer PDF failed, falling back to HTML:", pdfError);
      const printHtml = html.replace(
        "</body>",
        '<script>window.onload=function(){window.print();};</script></body>',
      );
      return new NextResponse(printHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar PDF" },
      { status: 500 },
    );
  }
}

/** Minimal HTML escape */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
