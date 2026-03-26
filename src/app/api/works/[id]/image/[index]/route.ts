import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index } = await params;
  const idx = parseInt(index, 10);

  const work = await prisma.artwork.findUnique({
    where: { id },
    select: { images: true },
  });

  if (!work || !work.images || idx < 0 || idx >= work.images.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  const imageData = work.images[idx];

  // If it's a URL (Cloudinary etc), redirect to it
  if (!imageData.startsWith("data:")) {
    return NextResponse.redirect(imageData);
  }

  // Parse base64 data URI: "data:image/jpeg;base64,/9j/4AAQ..."
  const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return new NextResponse("Invalid image", { status: 400 });
  }

  const contentType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
