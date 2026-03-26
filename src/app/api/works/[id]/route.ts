import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImages } from "@/lib/cloudinary";

// PUT /api/works/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, technique, size, value, description, images } = body;

  try {
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title?.trim() || '';
    if (technique !== undefined) data.technique = technique.trim();
    if (size !== undefined) data.size = size.trim();
    if (value !== undefined)
      data.value = value !== null && value !== "" ? parseFloat(value) : null;
    if (description !== undefined)
      data.description = description?.trim() || null;
    if (body.hidden !== undefined) data.hidden = body.hidden;
    if (body.sold !== undefined) data.sold = body.sold;
    if (body.imagePositions !== undefined) data.imagePositions = body.imagePositions;
    if (body.coverImageIndex !== undefined) data.coverImageIndex = body.coverImageIndex;
    if (body.promoPrice !== undefined) data.promoPrice = body.promoPrice !== null && body.promoPrice !== "" ? parseFloat(body.promoPrice) : null;
    if (body.promoUntil !== undefined) data.promoUntil = body.promoUntil ? new Date(body.promoUntil) : null;

    // Handle images
    if (images !== undefined) {
      const base64Images = images.filter((img: string) => img.startsWith("data:"));
      const existingUrls = images.filter((img: string) => !img.startsWith("data:"));

      if (base64Images.length > 0) {
        try {
          const uploaded = await uploadImages(base64Images);
          data.images = [...existingUrls, ...uploaded];
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          return NextResponse.json(
            { error: "Failed to upload images. Please try again." },
            { status: 502 }
          );
        }
      } else {
        data.images = existingUrls;
      }
    }

    const work = await prisma.artwork.update({
      where: { id },
      data,
    });
    return NextResponse.json(work);
  } catch (err) {
    console.error("Failed to update work:", err);
    return NextResponse.json(
      { error: "Failed to update work" },
      { status: 500 }
    );
  }
}

// DELETE /api/works/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.artwork.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
