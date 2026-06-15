import { NextResponse } from "next/server";
import { getBatchTraceability } from "@/app/server/livestock/traceability-portal";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchCode: string }> },
) {
  try {
    const { batchCode } = await params;
    if (!batchCode?.trim()) {
      return NextResponse.json({ error: "Batch code is required" }, { status: 400 });
    }
    const data = await getBatchTraceability(batchCode.trim());
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
