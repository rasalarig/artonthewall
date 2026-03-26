import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/artists/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: { works: true },
  });
  if (!artist)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(artist);
}

// PUT /api/artists/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, characteristics } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name.trim();
    // Regenerate slug
    data.slug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (characteristics !== undefined) data.characteristics = characteristics;

  const artist = await prisma.artist.update({
    where: { id },
    data,
    include: { works: true },
  });
  return NextResponse.json(artist);
}

// PATCH /api/artists/:id — toggle featured, hidden, coverWorkId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.featured !== undefined) data.featured = body.featured;
  if (body.hidden !== undefined) data.hidden = body.hidden;
  if (body.coverWorkId !== undefined) data.coverWorkId = body.coverWorkId;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No action" }, { status: 400 });
  }

  const artist = await prisma.artist.update({
    where: { id },
    data,
    include: { works: true },
  });
  return NextResponse.json(artist);
}

// DELETE /api/artists/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.artist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
