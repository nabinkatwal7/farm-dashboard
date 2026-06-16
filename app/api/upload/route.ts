import { ok } from "@/app/lib/api";
import { getCurrentUser } from "@/app/lib/auth";
import { uploadImage } from "@/app/server/blob/upload";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || user.farmId;

  if (!file) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  const result = await uploadImage(file, folder);
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }

  return ok(result);
}
