import "server-only";

import { put } from "@vercel/blob";
import crypto from "crypto";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const JPEG_QUALITY = 80;

export type UploadResult = { url: string } | { error: string };

export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Unsupported file type. Use JPEG, PNG, WebP, or AVIF." };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { error: "File too large. Max 20 MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer)
      .rotate()
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const ext = "jpg";
    const name = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const { url } = await put(name, compressed, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
    });

    return { url };
  } catch {
    return { error: "Failed to process or upload image." };
  }
}
