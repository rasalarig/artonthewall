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

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (technique !== undefined) data.technique = technique.trim();
  if (size !== undefined) data.size = size.trim();
  if (value !== undefined)
    data.value = value !== null && value !== "" ? parseFloat(value) : null;
  if (description !== undefined)
    data.description = description?.trim() || null;

  // Handle images
  if (images !== undefined) {
    const base64Images = images.filter((img: string) => img.startsWith("data:"));
    const existingUrls = images.filter((img: string) => !img.startsWith("data:"));

    if (base64Images.length > 0) {
      const uploaded = await uploadImages(base64Images);
      data.images = [...existingUrls, ...uploaded];
    } else {
      data.images = existingUrls;
    }
  }

  const work = await prisma.artwork.update({
    where: { id },
    data,
  });
  return NextResponse.json(work);
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
