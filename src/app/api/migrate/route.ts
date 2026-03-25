import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImages } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artists, markupPercentage } = body;

  if (!artists || !Array.isArray(artists)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const results = { artists: 0, works: 0, images: 0, errors: [] as string[] };

  for (const artist of artists) {
    try {
      // Create or update artist
      const dbArtist = await prisma.artist.upsert({
        where: { slug: artist.slug },
        update: {
          name: artist.name,
          characteristics: artist.characteristics || [],
        },
        create: {
          name: artist.name,
          slug: artist.slug,
          characteristics: artist.characteristics || [],
        },
      });
      results.artists++;

      // Process works
      for (const work of artist.works || []) {
        try {
          // Collect images (base64 data URIs and possibly legacy single image)
          let allImages: string[] = [];
          if (work.images && work.images.length > 0) {
            allImages = work.images;
          } else if (work.image) {
            allImages = [work.image];
          }

          // Upload base64 images to Cloudinary
          let imageUrls: string[] = [];
          if (allImages.length > 0) {
            const base64Images = allImages.filter((img: string) =>
              img.startsWith("data:")
            );
            const existingUrls = allImages.filter(
              (img: string) => !img.startsWith("data:")
            );

            if (base64Images.length > 0) {
              try {
                const uploaded = await uploadImages(
                  base64Images,
                  `artes-dan/${artist.slug}`
                );
                imageUrls = [...existingUrls, ...uploaded];
                results.images += base64Images.length;
              } catch (e) {
                // If Cloudinary upload fails (no credentials), store as-is
                imageUrls = allImages;
                results.errors.push(
                  `Image upload failed for ${work.title}: ${e}`
                );
              }
            } else {
              imageUrls = existingUrls;
            }
          }

          await prisma.artwork.create({
            data: {
              artistId: dbArtist.id,
              title: work.title || "Sem titulo",
              technique: work.technique || "",
              size: work.size || "",
              value:
                work.value !== null && work.value !== undefined
                  ? parseFloat(work.value)
                  : null,
              description: work.description || null,
              images: imageUrls,
            },
          });
          results.works++;
        } catch (e) {
          results.errors.push(`Work "${work.title}" for ${artist.name}: ${e}`);
        }
      }
    } catch (e) {
      results.errors.push(`Artist "${artist.name}": ${e}`);
    }
  }

  // Save markup settings
  if (markupPercentage !== undefined) {
    await prisma.settings.upsert({
      where: { id: "global" },
      update: { markupPercentage },
      create: { id: "global", markupPercentage },
    });
  }

  return NextResponse.json(results);
}
