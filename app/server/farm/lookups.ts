import "server-only";

import { ApiError } from "@/app/lib/api";
import type { AuthUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function getField(fieldId: unknown, user: AuthUser) {
  if (typeof fieldId !== "string" || !fieldId) {
    throw new ApiError(400, "fieldId is required");
  }

  const field = await prisma.cropField.findFirst({
    where: { id: fieldId, farmId: user.farmId },
  });
  if (!field) throw new ApiError(404, "Field not found");
  return field;
}

export async function getAnimalByEarTag(earTag: unknown, user: AuthUser) {
  if (typeof earTag !== "string" || !earTag) {
    throw new ApiError(400, "earTag is required");
  }

  const animal = await prisma.animal.findFirst({
    where: { earTag, farmId: user.farmId },
  });
  if (!animal) throw new ApiError(404, "Animal not found");
  return animal;
}
