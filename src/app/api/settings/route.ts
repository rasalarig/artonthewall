import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GLOBAL_ID = "global";
const VALID_FILTERS = ["original", "preset1", "preset2", "preset3"];

// GET /api/settings
export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: GLOBAL_ID },
  });
  if (!settings) {
    // Create default settings
    settings = await prisma.settings.create({
      data: { id: GLOBAL_ID, markupPercentage: 30, imageFilter: "original" },
    });
  }
  return NextResponse.json(settings);
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.markupPercentage !== undefined) {
    if (typeof body.markupPercentage !== "number") {
      return NextResponse.json(
        { error: "markupPercentage must be a number" },
        { status: 400 },
      );
    }
    updateData.markupPercentage = body.markupPercentage;
  }

  if (body.imageFilter !== undefined) {
    if (!VALID_FILTERS.includes(body.imageFilter)) {
      return NextResponse.json(
        { error: "Invalid imageFilter value" },
        { status: 400 },
      );
    }
    updateData.imageFilter = body.imageFilter;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const settings = await prisma.settings.upsert({
    where: { id: GLOBAL_ID },
    update: updateData,
    create: { id: GLOBAL_ID, ...updateData },
  });

  return NextResponse.json(settings);
}
