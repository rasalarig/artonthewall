import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Import seed data - tsx can handle the path alias via tsconfig
  const { artists: seedArtists } = await import("../src/data/artists");

  console.log(`Seeding ${seedArtists.length} artists...`);

  // Clear existing data (order matters due to foreign keys)
  await prisma.artwork.deleteMany();
  await prisma.artist.deleteMany();

  for (const artist of seedArtists) {
    const dbArtist = await prisma.artist.create({
      data: {
        name: artist.name,
        slug: artist.slug,
        characteristics: artist.characteristics,
      },
    });

    for (const work of artist.works) {
      await prisma.artwork.create({
        data: {
          artistId: dbArtist.id,
          title: work.title,
          technique: work.technique,
          size: work.size,
          value: work.value,
          description: work.description || null,
          images: [], // Seed data has no images - they come from migration
        },
      });
    }

    console.log(`  + ${artist.name} (${artist.works.length} works)`);
  }

  // Default settings
  await prisma.settings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", markupPercentage: 0.3 },
  });

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
