import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const ARTISTAS_DIR = path.resolve('artistas');
const PUBLIC_UPLOADS = path.resolve('public', 'uploads');

function slugify(name) {
  return name.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseArtistName(folderName) {
  // "1 - Esbomgaroto" → "Esbomgaroto"
  // "12 - Rawls - RJ" → "Rawls - RJ"
  const match = folderName.match(/^\d+\s*-\s*(.+)$/);
  return match ? match[1].trim() : folderName.trim();
}

function parseValue(str) {
  if (!str) return null;
  let v = str.trim();
  v = v.replace(/R\$\s*/gi, '');
  v = v.replace(/cada/gi, '').trim();
  // Remove dots used as thousand separators, keep comma as decimal
  // Pattern: "2.145,00" → "2145.00", "1.800" → "1800", "2.600" → "2600"
  // If there's a comma, dots are thousand separators
  if (v.includes(',')) {
    v = v.replace(/\./g, ''); // remove thousand dots
    v = v.replace(',', '.'); // comma → decimal point
  } else {
    // No comma: dots are thousand separators (e.g., "1.800" = 1800)
    // But "1.5" could be decimal... In Brazilian context, "1.800" is 1800
    // Heuristic: if digits after dot are exactly 3, it's a thousand separator
    const dotMatch = v.match(/^(\d+)\.(\d{3})$/);
    if (dotMatch) {
      v = v.replace('.', '');
    }
  }
  const parsed = parseFloat(v);
  return isNaN(parsed) ? null : parsed;
}

const SIZE_PATTERN = /\b\d+(\.\d+)?\s*(cm\s*)?(x\s*\d+(\.\d+)?\s*(cm\s*)?(x\s*\d+(\.\d+)?\s*(cm)?)?)\b/i;
const A_SIZE_PATTERN = /^A[0-9]+/i;
const ART_TERMS = [
  'acrílica', 'acrilica', 'spray', 'nanquim', 'mista', 'canson', 'mdf',
  'madeira', 'tela', 'papel', 'kraft', 'pastel', 'oleoso', 'óleo', 'oleo',
  'marcador', 'squeezer', 'colagem', 'digital', 'print', 'fineart',
  'strass', 'caneta', 'giz', 'pintura', 'arches', 'painel'
];

function isValueLine(line) {
  const cleaned = line.replace(/R\$\s*/gi, '').replace(/cada/gi, '').trim();
  // Line is purely numeric (with dots/commas as separators)
  return /^\d[\d.,]*$/.test(cleaned);
}

function isSizeLine(line) {
  const l = line.trim();
  if (A_SIZE_PATTERN.test(l)) return true;
  if (SIZE_PATTERN.test(l)) return true;
  // "Painel 70x70" contains a size
  if (/\d+\s*x\s*\d+/i.test(l)) return true;
  // "35 diâmetro" or similar
  if (/\d+\s*diâmetro/i.test(l)) return true;
  return false;
}

function isTechniqueLine(line) {
  const lower = line.toLowerCase();
  return ART_TERMS.some(term => lower.includes(term));
}

function parseWorkCharacteristics(text, workFolderName) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let technique = '';
  let size = '';
  let value = null;

  // Check for labeled format first
  const labeled = {};
  for (const line of lines) {
    const tecMatch = line.match(/^T[ée]cnica[\s:,]+(.+)/i);
    if (tecMatch) {
      labeled.technique = tecMatch[1].trim();
      continue;
    }
    const tamMatch = line.match(/^Tamanho[\s:]+(.+)/i);
    if (tamMatch) {
      labeled.size = tamMatch[1].trim();
      continue;
    }
    const valMatch = line.match(/^Valor[\s:]+(.+)/i);
    if (valMatch) {
      labeled.value = valMatch[1].trim();
      continue;
    }
  }

  if (labeled.technique || labeled.size || labeled.value) {
    // Labeled format found
    technique = labeled.technique || '';
    size = labeled.size || '';
    value = labeled.value ? parseValue(labeled.value) : null;

    // Some labeled files have extra lines that are technique descriptions
    // e.g., "Print fineart canson 200g photo matte" after the labeled fields
    if (!technique) {
      for (const line of lines) {
        if (line.match(/^T[ée]cnica/i) || line.match(/^Tamanho/i) || line.match(/^Valor/i)) continue;
        if (isTechniqueLine(line)) {
          technique = line;
          break;
        }
      }
    }

    // For "Painel 70x70" style, also capture value from unlabeled line
    if (value === null) {
      for (const line of lines) {
        if (line.match(/^T[ée]cnica/i) || line.match(/^Tamanho/i) || line.match(/^Valor/i)) continue;
        if (isValueLine(line)) {
          value = parseValue(line);
          break;
        }
      }
    }

    // For size from unlabeled "Painel 70x70"
    if (!size) {
      for (const line of lines) {
        if (line.match(/^T[ée]cnica/i) || line.match(/^Tamanho/i) || line.match(/^Valor/i)) continue;
        if (isSizeLine(line)) {
          size = line;
          break;
        }
      }
    }
  } else {
    // Unlabeled format: use heuristics
    for (const line of lines) {
      // Skip "CxAxL" label
      if (/^CxAxL$/i.test(line)) continue;

      if (!value && isValueLine(line)) {
        value = parseValue(line);
      } else if (!value && /^R\$\s*[\d.,]+$/.test(line)) {
        value = parseValue(line);
      } else if (!size && isSizeLine(line)) {
        size = line;
      } else if (!technique && isTechniqueLine(line)) {
        technique = line;
      }
    }

    // For lines like "50x40  - 2.600" (single line with both size and value)
    if (lines.length === 1) {
      const singleLine = lines[0];
      const singleMatch = singleLine.match(/^(.+?)\s*-\s*(?:R\$\s*)?(.+)$/);
      if (singleMatch) {
        size = singleMatch[1].trim();
        value = parseValue(singleMatch[2].trim());
      }
    }

    // For "A5 - Fineart Canson Photo Marte" style (size + technique on one line)
    if (!technique && size) {
      const dashSplit = size.match(/^(A\d+)\s*-\s*(.+)$/i);
      if (dashSplit) {
        size = dashSplit[1];
        technique = dashSplit[2].trim();
      }
    }
  }

  // Fallback: use work folder name as technique if still empty
  if (!technique) {
    technique = workFolderName;
  }

  // Clean up size: remove "Painel " prefix but keep dimensions
  if (size) {
    const panelMatch = size.match(/^Painel\s+(.+)$/i);
    if (panelMatch) {
      size = panelMatch[1].trim();
    }
  }

  return { technique, size, value };
}

async function main() {
  console.log('Starting import from folders...');
  console.log(`Reading artists from: ${ARTISTAS_DIR}`);

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.artwork.deleteMany();
  await prisma.artist.deleteMany();
  console.log('Existing data cleared.');

  const artistFolders = fs.readdirSync(ARTISTAS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => {
      const numA = parseInt(a.name);
      const numB = parseInt(b.name);
      return numA - numB;
    });

  let totalArtists = 0;
  let totalWorks = 0;
  let totalImages = 0;

  // Ensure public/uploads exists
  fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });

  for (const artistDir of artistFolders) {
    const artistPath = path.join(ARTISTAS_DIR, artistDir.name);
    const artistName = parseArtistName(artistDir.name);
    const artistSlug = slugify(artistName);

    // Read artist characteristics
    const artistCharFile = path.join(artistPath, 'caracteristicas.txt');
    let characteristics = [];
    if (fs.existsSync(artistCharFile)) {
      const charText = fs.readFileSync(artistCharFile, 'utf-8').trim();
      characteristics = charText.split(',').map(c => c.trim().replace(/\.$/, '')).filter(c => c.length > 0);
    }

    console.log(`\nArtist: ${artistName} (${artistSlug})`);
    console.log(`  Characteristics: ${characteristics.join(', ')}`);

    const artist = await prisma.artist.create({
      data: {
        name: artistName,
        slug: artistSlug,
        characteristics,
      },
    });

    totalArtists++;

    // Process work subfolders
    const workFolders = fs.readdirSync(artistPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const workDir of workFolders) {
      const workPath = path.join(artistPath, workDir.name);
      const workName = workDir.name;
      const workSlug = slugify(workName);

      // Parse work characteristics
      const workCharFile = path.join(workPath, 'caracteristicas.txt');
      let technique = workName;
      let size = '';
      let value = null;

      if (fs.existsSync(workCharFile)) {
        const workText = fs.readFileSync(workCharFile, 'utf-8');
        const parsed = parseWorkCharacteristics(workText, workName);
        technique = parsed.technique;
        size = parsed.size;
        value = parsed.value;
      }

      // Collect images
      const imageFiles = fs.readdirSync(workPath)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

      // Copy images to public/uploads
      const destDir = path.join(PUBLIC_UPLOADS, artistSlug, workSlug);
      fs.mkdirSync(destDir, { recursive: true });

      const imageUrls = [];
      for (const imgFile of imageFiles) {
        const srcPath = path.join(workPath, imgFile);
        const destPath = path.join(destDir, imgFile);
        fs.copyFileSync(srcPath, destPath);
        imageUrls.push(`/uploads/${artistSlug}/${workSlug}/${imgFile}`);
        totalImages++;
      }

      console.log(`  Work: ${workName} | Size: ${size} | Value: ${value} | Technique: ${technique} | Images: ${imageFiles.length}`);

      await prisma.artwork.create({
        data: {
          artistId: artist.id,
          title: workName,
          technique,
          size,
          value,
          images: imageUrls,
        },
      });

      totalWorks++;
    }
  }

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', markupPercentage: 0.3 },
  });
  console.log('\nDefault settings created (markupPercentage: 0.3)');

  console.log(`\n=== Import Summary ===`);
  console.log(`Artists: ${totalArtists}`);
  console.log(`Works:   ${totalWorks}`);
  console.log(`Images:  ${totalImages}`);
  console.log(`========================`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Import failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
