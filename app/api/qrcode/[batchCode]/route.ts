import "server-only";

import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchCode: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { batchCode } = await params;
  if (!batchCode?.trim()) {
    return NextResponse.json({ error: "Batch code is required" }, { status: 400 });
  }

  const batch = await prisma.batchRecord.findUnique({
    where: { farmId_batchCode: { farmId: user.farmId, batchCode: batchCode.trim() } },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const origin = _request.headers.get("origin") ?? `${_request.nextUrl.protocol}//${_request.nextUrl.host}`;
  const traceUrl = `${origin}/traceability/${encodeURIComponent(batchCode.trim())}`;

  const svg = await QRCode.toString(traceUrl, {
    type: "svg",
    margin: 2,
    width: 400,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Disposition": `inline; filename="qrcode-${batchCode.trim()}.svg"`,
    },
  });
}
