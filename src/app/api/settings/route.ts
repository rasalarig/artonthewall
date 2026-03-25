import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GLOBAL_ID = "global";

// GET /api/settings
export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: GLOBAL_ID },
  });
  if (!settings) {
    // Create default settings
    settings = await prisma.settings.create({
      data: { id: GLOBAL_ID, markupPercentage: 30 },
    });
  }
  return NextResponse.json(settings);
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { markupPercentage } = body;

  if (markupPercentage === undefined || typeof markupPercentage !== "number") {
    return NextResponse.json(
      { error: "markupPercentage must be a number" },
      { status: 400 }
    );
  }

  const settings = await prisma.settings.upsert({
    where: { id: GLOBAL_ID },
    update: { markupPercentage },
    create: { id: GLOBAL_ID, markupPercentage },
  });

  return NextResponse.json(settings);
}
