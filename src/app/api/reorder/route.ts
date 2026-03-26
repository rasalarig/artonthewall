import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/reorder
// Body: { type: "artist" | "work", items: [{id: string, sortOrder: number}] }
export async function POST(req: NextRequest) {
  const { type, items } = await req.json();

  if (!type || !items?.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updates = items.map((item: { id: string; sortOrder: number }) => {
    if (type === "artist") {
      return prisma.artist.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    } else {
      return prisma.artwork.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }
  });

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
