import puppeteer from "puppeteer";
import { writeFileSync, existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, "..", "catalogo-art-on-the-wall.pdf");
const IMAGES_DIR = path.resolve(__dirname, "..", "public", "images", "catalog-sm");

// ---------------------------------------------------------------------------
// Artist data
// ---------------------------------------------------------------------------
const artists = [
  {
    name: "Esbomgaroto",
    characteristics: ["graffiti", "personagens humanoides", "stop motion", "super dollfie"],
    works: [
      { title: "Boneco Stop Motion", technique: "Stop motion com boneco super dollfie", size: "33cm altura", value: 1600 },
      { title: "Cabeca Pitbull", technique: "Pintura", size: "77x67", value: 1800 },
      { title: "Sem titulo", technique: "Pintura", size: "50x40", value: 2600 },
    ],
  },
  {
    name: "Snek",
    characteristics: ["graffiti", "letras", "personagens"],
    works: [
      { title: "Sem titulo", technique: "Tecnica mista sobre canson 300g", size: "30x42", value: 1200 },
    ],
  },
  {
    name: "Nem",
    characteristics: ["graffiti", "letras abstratas", "esculturas"],
    works: [
      { title: "Ns 2024", technique: "Escultura", size: "47x38x22cm CxAxL", value: 2200 },
      { title: "O cavalo", technique: "Escultura", size: "37x35x16cm CxAxL", value: 3000 },
      { title: "A danca", technique: "Escultura", size: "28x25x18cm CxAxL", value: 2200 },
      { title: "Escultura sobre pintura", technique: "Escultura sobre pintura em painel", size: "40x40", value: 2000 },
    ],
  },
  {
    name: "Locones",
    characteristics: ["vandal", "letras", "personagens"],
    works: [
      { title: "Explod Alfabeto", technique: "Marcador squeezer, spray sobre tela", size: "70x70", value: 4500 },
      { title: "Gotinha", technique: "Fineart Canson PhotoMatte", size: "A5", value: 600 },
      { title: "Mapa da Philadelphia", technique: "Pintura", size: "45x60", value: 2145 },
      { title: "Tags", technique: "Fotografia - Fineart Canson Photo Matte", size: "A5", value: 375 },
    ],
  },
  {
    name: "Shesko e Sirius",
    characteristics: ["graffiti", "cartoon", "natureza"],
    works: [
      { title: "Magali", technique: "Acrilica e spray sobre tela com aplicacao de strass", size: "70x50cm", value: 2200 },
      { title: "Ta uma uva", technique: "Acrilica sobre tela com aplicacao de strass", size: "70x50cm", value: 2400 },
      { title: "Guarana do Brasil", technique: "Acrilica e caneta sobre madeira", size: "14x33cm", value: 930 },
      { title: "Jerry", technique: "Acrilica sobre tela com aplicacao de strass", size: "30x30cm", value: 1190 },
      { title: "Piu Piu", technique: "Acrilica sobre tela com aplicacao de strass", size: "30x30cm", value: 1190 },
    ],
  },
  {
    name: "Burni",
    characteristics: ["graffiti", "personagens", "originalidade"],
    works: [
      { title: "Notas", technique: "Mista sobre painel", size: "50x60", value: 1800 },
      { title: "Nao se cobre tanto", technique: "Mista sobre painel", size: "20x30", value: 400 },
      { title: "Terceira Visao", technique: "Mista sobre painel", size: "20x30", value: 300 },
      { title: "Style", technique: "Mista sobre painel", size: "20x30", value: 300 },
      { title: "No Rain no gain", technique: "Mista sobre madeira", size: "21x45", value: 400 },
      { title: "Auto", technique: "Giz pastel oleoso sobre Canson", size: "20x30", value: 400 },
    ],
  },
  {
    name: "Bruninho x2",
    characteristics: ["surrealismo", "personagens", "tattoo"],
    works: [
      { title: "Sem titulo", technique: "Pintura sobre mdf", size: "40x35", value: 250 },
      { title: "Sem titulo", technique: "Acrilica sobre painel de mdf", size: "50x100cm", value: 750 },
      { title: "Sem titulo", technique: "Mista sobre mdf", size: "35 diametro", value: 180 },
      { title: "Sem titulo", technique: "Print digital", size: "A4", value: 100 },
    ],
  },
  {
    name: "Estranho",
    characteristics: ["oriental", "tattoo", "graffiti"],
    works: [
      { title: "Oni nose", technique: "Acrilica sobre madeira", size: "43x43", value: 1450 },
      { title: "Verde e Rosa", technique: "Acrilica sobre papel arches 300g", size: "33x18cm", value: 450 },
      { title: "Solitario", technique: "Nanquim sobre Canson 300g", size: "30x40", value: 150 },
      { title: "Sabadao", technique: "Nanquim sobre Canson 300g", size: "30x40", value: 150 },
      { title: "Sapo druida 2", technique: "Nanquim sobre Canson 300g", size: "30x40", value: 150 },
      { title: "Sapo druida 1", technique: "Nanquim sobre Canson 300g", size: "30x40", value: 150 },
    ],
  },
  {
    name: "Pes",
    characteristics: ["surrealismo", "graffiti", "easter eggs"],
    works: [
      { title: "Ouvindo passaros", technique: "Spray sobre tela", size: "100x70", value: 3500 },
      { title: "Quando atravessa a porta", technique: "Spray sobre tela", size: "80x60", value: null },
      { title: "Como chama", technique: "Acrilica e spray sobre tela", size: "80x60", value: null },
    ],
  },
  {
    name: "Fuku",
    characteristics: ["oriental", "nanquim", "abstracoes"],
    works: [
      { title: "Fungi", technique: "Nanquim sobre kraft", size: "30x40", value: 1040 },
    ],
  },
  {
    name: "Krika",
    characteristics: ["tattoo", "aquarela", "nanquim"],
    works: [],
  },
  {
    name: "Pinima",
    characteristics: ["tattoo", "hachura", "pontilhismo"],
    works: [],
  },
  {
    name: "Endo",
    characteristics: ["abstracoes", "personagens", "graffiti"],
    works: [
      { title: "My happy family 1/10", technique: "Colagem digital numerada - Print fineart canson 200g photo matte", size: "30x42", value: 300 },
    ],
  },
  {
    name: "Rawls",
    characteristics: ["graffiti", "diorama", "tattoo"],
    works: [
      { title: "Galinho", technique: "Mista - Print Fineart canson 200g photo matte", size: "A5 21x15", value: 200 },
    ],
  },
  {
    name: "Nath",
    characteristics: ["muralista", "natureza", "expressividade"],
    works: [],
  },
  {
    name: "Magico",
    characteristics: ["graffiti", "cores vivas", "personagens"],
    works: [
      { title: "Vandal fofo", technique: "Tecnica mista sobre tela", size: "20x30", value: 290 },
    ],
  },
  {
    name: "Dan",
    characteristics: ["cartoon", "reflexao", "graffiti"],
    works: [
      { title: "Cidade linda", technique: "Acrilica sobre painel", size: "60x90", value: 2500 },
      { title: "Dias bons dias ruins", technique: "Acrilica sobre mdf", size: "60x40", value: 450 },
      { title: "Bem trash", technique: "Acrilica sobre mdf", size: "49x20", value: 800 },
      { title: "VANdal", technique: "Giz pastel seco, spray sobre painel de madeira", size: "58.5x49", value: 700 },
    ],
  },
  // Extra artists from PDF images
  {
    name: "Original",
    characteristics: ["cultura urbana", "latina", "cartoon"],
    works: [
      { title: "Whats up homie", technique: "Tinta acrilica sobre tela", size: "80x60cm", value: 11000 },
      { title: "Marathon Style", technique: "Tinta acrilica sobre tela", size: "60x60cm", value: 7540 },
      { title: "Car Club", technique: "Spray sobre mdf", size: "40x60cm", value: 3640 },
      { title: "Red eyes", technique: "Acrilica sobre tela", size: "16x22cm", value: 650 },
      { title: "Smile Latina", technique: "Acrilica sobre tela", size: "20x25cm", value: 850 },
    ],
  },
  {
    name: "Judit",
    characteristics: ["letras", "personagens", "linhas"],
    works: [
      { title: "Latinha de Spray", technique: "Croche e linha", size: "76x55cm", value: 11000 },
      { title: "Casinha", technique: "Croche e linha", size: "37x55cm", value: 3400 },
      { title: "Casinha", technique: "Croche e linha", size: "40x40cm", value: 2900 },
      { title: "Rolinho", technique: "Croche e linha", size: "23x24cm", value: 900 },
      { title: "Vandalima", technique: "Croche e linha", size: "29x40cm", value: 2000 },
    ],
  },
  {
    name: "Chris Matos",
    characteristics: ["natureza", "geometria", "cores chapadas"],
    works: [
      { title: "Sem titulo", technique: "Acrilico sobre chapa de ferro", size: "91x43cm", value: 1300 },
      { title: "Sem titulo (4 pecas)", technique: "Acrilica s/ tela", size: "24x18cm", value: 780 },
      { title: "Sem titulo", technique: "Acrilica sobre mapa da Italia", size: "60x60cm", value: 350 },
    ],
  },
  {
    name: "Ode",
    characteristics: ["personagem", "ludico", "colorido"],
    works: [
      { title: "Salve o planeta", technique: "Acrilica sobre painel", size: "100x100cm", value: 3650 },
      { title: "Pirulitinha e o Gato", technique: "Acrilica sobre painel", size: "40x50cm", value: 1600 },
      { title: "Pirulito Flor", technique: "Acrilica sobre painel", size: "40x30cm", value: 1250 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page-to-artist image mapping
// ---------------------------------------------------------------------------
const PAGE_TO_ARTIST = {
  1: "Esbomgaroto",
  2: "Snek",
  3: "Nem",
  4: "Locones",
  5: "Shesko e Sirius",
  6: "Shesko e Sirius",
  7: "Burni",
  8: "Bruninho x2",
  9: "Estranho",
  10: "Fuku",
  11: "Krika",
  12: "Pes",
  13: "Endo",
  14: "Rawls",
  15: "Magico",
  16: "Dan",
};

// ---------------------------------------------------------------------------
// Image loading helpers
// ---------------------------------------------------------------------------
function loadImageAsDataUri(filePath) {
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  const base64 = buf.toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

function getArtistImages(artistName) {
  const images = [];

  // Check for page-mapped images (artistas-pN-M.jpg)
  for (const [page, name] of Object.entries(PAGE_TO_ARTIST)) {
    if (name !== artistName) continue;
    // Find all images for this page
    const prefix = `artistas-p${page}-`;
    const allFiles = readdirSync(IMAGES_DIR).filter(
      (f) => f.startsWith(prefix) && f.endsWith(".jpg")
    );
    // Sort numerically by index
    allFiles.sort((a, b) => {
      const numA = parseInt(a.replace(prefix, "").replace(".jpg", ""), 10);
      const numB = parseInt(b.replace(prefix, "").replace(".jpg", ""), 10);
      return numA - numB;
    });
    for (const file of allFiles) {
      const uri = loadImageAsDataUri(path.join(IMAGES_DIR, file));
      if (uri) images.push(uri);
    }
  }

  // Check for special-prefix images (original-p1-1.jpg, judit-p1-1.jpg, etc.)
  const specialPrefixes = {
    Original: "original-",
    Judit: "judit-",
    "Chris Matos": "chris-matos-",
    Ode: "ode-",
  };
  const sp = specialPrefixes[artistName];
  if (sp) {
    const allFiles = readdirSync(IMAGES_DIR).filter(
      (f) => f.startsWith(sp) && f.endsWith(".jpg")
    );
    allFiles.sort();
    for (const file of allFiles) {
      const uri = loadImageAsDataUri(path.join(IMAGES_DIR, file));
      if (uri) images.push(uri);
    }
  }

  return images;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const totalWorks = artists.reduce((sum, a) => sum + a.works.length, 0);

function formatCurrency(value) {
  if (value === null || value === undefined) return "Consultar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------
function buildHtml() {
  const tocRows = artists
    .map((a, i) => {
      const pageNum = i + 3;
      return `<tr><td class="toc-name">${a.name}</td><td class="toc-dots"></td><td class="toc-page">${String(pageNum).padStart(2, "0")}</td></tr>`;
    })
    .join("\n");

  const artistPages = artists
    .map((artist) => {
      const tags = artist.characteristics
        .map((c) => `<span class="tag">${c}</span>`)
        .join("");

      // Build image gallery with detailed captions
      const images = getArtistImages(artist.name);
      let galleryHtml = "";
      if (images.length > 0) {
        // Helper to build info block for a work
        const buildInfo = (work) => {
          if (!work) return "";
          const displayTitle = work.title === "Sem titulo" ? "-" : work.title;
          return `<div class="gallery-info">
            <p class="info-title">${displayTitle}</p>
            <p class="info-detail">${work.technique}</p>
            <p class="info-detail">${work.size} &middot; ${formatCurrency(work.value)}</p>
          </div>`;
        };

        // Image figures with captions
        const imgFigures = images
          .map((uri, idx) => {
            const work = artist.works[idx];
            return `<div class="gallery-figure"><img src="${uri}" class="gallery-img" />${buildInfo(work)}</div>`;
          })
          .join("\n");

        // Text-only entries for works without matching images
        let extraFigures = "";
        if (artist.works.length > images.length) {
          extraFigures = artist.works
            .slice(images.length)
            .map((w) => {
              return `<div class="gallery-figure gallery-figure--text-only">${buildInfo(w)}</div>`;
            })
            .join("\n");
        }

        galleryHtml = `<div class="gallery">${imgFigures}${extraFigures}</div>`;
      }

      let worksHtml;
      if (artist.works.length === 0 && images.length === 0) {
        worksHtml = `<p class="no-works">sem obras cadastradas</p>`;
      } else if (images.length === 0 && artist.works.length > 0) {
        // No images but has works: show a simple list
        const listItems = artist.works
          .map((w) => {
            const title = w.title === "Sem titulo" ? "-" : w.title;
            return `<div class="work-list-item">
              <span class="info-title">${title}</span>
              <span class="info-detail">${w.technique} &middot; ${w.size} &middot; ${formatCurrency(w.value)}</span>
            </div>`;
          })
          .join("\n");
        worksHtml = `<div class="work-list">${listItems}</div>`;
      } else {
        worksHtml = "";
      }

      return `
        <div class="artist-page">
          <div class="yellow-bar"></div>
          <h2 class="artist-name">${artist.name.toLowerCase()}</h2>
          <div class="tags">${tags}</div>
          ${galleryHtml}
          ${worksHtml}
          <div class="yellow-line-bottom"></div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      font-family: 'Inter', sans-serif;
      background: #000;
      color: #fff;
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
      text-transform: lowercase;
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
      font-size: 15px;
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
      font-size: 15px;
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
      font-size: 12px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 20px;
    }

    /* ---- Image Gallery ---- */
    .gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    .gallery-figure {
      width: calc(50% - 5px);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .gallery-figure--text-only {
      background: #111;
      border-radius: 6px;
      padding: 12px;
      justify-content: center;
      min-height: 80px;
    }
    .gallery-img {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 6px;
      border: 2px solid #222;
    }
    .gallery-info {
      width: 100%;
      padding: 6px 2px 2px;
      text-align: center;
    }
    .info-title {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
      line-height: 1.3;
    }
    .info-detail {
      font-size: 10px;
      color: #aaa;
      line-height: 1.3;
      margin-bottom: 1px;
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
  </style>
</head>
<body>

  <!-- Page 1: Cover -->
  <div class="cover">
    <div class="catalog-label">Catalogo Digital</div>
    <h1>ART ON THE WALL</h1>
    <p class="subtitle">Expo Coletiva &bull; Arte Urbana &amp; Graffiti</p>
    <div class="yellow-divider"></div>
  </div>

  <!-- Page 2: TOC -->
  <div class="toc">
    <h2>artistas</h2>
    <p class="stats">${artists.length} Artistas &bull; ${totalWorks}+ Obras</p>
    <table>
      ${tocRows}
    </table>
  </div>

  <!-- Artist pages -->
  ${artistPages}

  <!-- Credits page -->
  <div class="credits">
    <h2>Art on the Wall</h2>
    <p class="credits-sub">Expo Coletiva de Arte Urbana</p>
    <p class="credits-note">Catalogo gerado digitalmente</p>
  </div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------
async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const html = buildHtml();
  console.log("Setting HTML content...");
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Wait a moment for images to render
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Generating PDF...");
  await page.pdf({
    path: OUTPUT_PATH,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  console.log(`PDF saved to: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Error generating PDF:", err);
  process.exit(1);
});
