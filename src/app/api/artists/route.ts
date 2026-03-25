import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/artists — list all artists with works
export async function GET() {
  const artists = await prisma.artist.findMany({
    include: { works: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(artists);
}

// POST /api/artists — create a new artist
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, characteristics } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug already exists
  const existing = await prisma.artist.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const artist = await prisma.artist.create({
    data: {
      name: name.trim(),
      slug: finalSlug,
      characteristics: characteristics || [],
    },
    include: { works: true },
  });

  return NextResponse.json(artist, { status: 201 });
}
