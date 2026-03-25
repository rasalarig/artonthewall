import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImages } from "@/lib/cloudinary";

// POST /api/works — create a new artwork
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artistId, title, technique, size, value, description, images } = body;

  if (!artistId || !title?.trim() || !technique?.trim() || !size?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Upload images to Cloudinary if provided
  let imageUrls: string[] = [];
  if (images && images.length > 0) {
    // Filter: only upload base64 data URIs, keep existing URLs as-is
    const base64Images = images.filter((img: string) => img.startsWith("data:"));
    const existingUrls = images.filter((img: string) => !img.startsWith("data:"));

    if (base64Images.length > 0) {
      const uploaded = await uploadImages(base64Images);
      imageUrls = [...existingUrls, ...uploaded];
    } else {
      imageUrls = existingUrls;
    }
  }

  const work = await prisma.artwork.create({
    data: {
      artistId,
      title: title.trim(),
      technique: technique.trim(),
      size: size.trim(),
      value:
        value !== undefined && value !== null && value !== ""
          ? parseFloat(value)
          : null,
      description: description?.trim() || null,
      images: imageUrls,
    },
  });

  return NextResponse.json(work, { status: 201 });
}
