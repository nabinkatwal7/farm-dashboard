import "server-only";

import { Prisma } from "@prisma/client";
import { ApiError } from "@/app/lib/api";
import type { AuthUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { farmDb, getEntityConfig } from "@/app/server/farm/entity-config";
import { getAnimalByEarTag, getField } from "@/app/server/farm/lookups";
import {
  cleanBody,
  toRotationInput,
  toSaleItemInput,
} from "@/app/server/farm/payload";
import { whereForScope } from "@/app/server/farm/scope";

export async function listFarmEntity(entity: string, user: AuthUser) {
  const config = getEntityConfig(entity);
  return farmDb[config.model].findMany({
    where: whereForScope(config, user.farmId),
    include: config.include,
    orderBy: config.orderBy,
  });
}

export async function createFarmEntity(
  entity: string,
  body: Record<string, unknown>,
  user: AuthUser,
) {
  const config = getEntityConfig(entity);
  const data = cleanBody(body);

  if (entity === "fields") {
    const rotation = Array.isArray(data.rotation) ? data.rotation : [];
    delete data.rotation;
    return prisma.cropField.create({
      data: {
        ...data,
        farmId: user.farmId,
        rotation: {
          create: rotation.map(toRotationInput),
        },
      } as Prisma.CropFieldUncheckedCreateInput,
      include: { rotation: true },
    });
  }

  if (entity === "inputLogs") {
    const field = await getField(data.fieldId, user);
    return prisma.inputLog.create({
      data: {
        ...data,
        fieldId: field.id,
        fieldName: data.fieldName || field.name,
        operator: data.operator || user.name,
        operatorId: user.id,
      } as Prisma.InputLogUncheckedCreateInput,
    });
  }

  if (entity === "yieldRecords") {
    const field = await getField(data.fieldId, user);
    return prisma.yieldRecord.create({
      data: {
        ...data,
        fieldId: field.id,
        fieldName: data.fieldName || field.name,
      } as Prisma.YieldRecordUncheckedCreateInput,
    });
  }

  if (entity === "medicalRecords") {
    const animal = await getAnimalByEarTag(data.earTag, user);
    return prisma.medicalRecord.create({
      data: {
        ...data,
        animalId: animal.id,
        earTag: animal.earTag,
      } as Prisma.MedicalRecordUncheckedCreateInput,
    });
  }

  if (entity === "weightRecords") {
    const animal = await getAnimalByEarTag(data.earTag, user);
    return prisma.weightRecord.create({
      data: {
        ...data,
        animalId: animal.id,
        earTag: animal.earTag,
      } as Prisma.WeightRecordUncheckedCreateInput,
    });
  }

  if (entity === "stockAdjustments") {
    const stockItemId = data.stockItemId;
    if (typeof stockItemId !== "string") {
      throw new ApiError(400, "stockItemId is required");
    }
    const stockItem = await prisma.stockItem.findFirst({
      where: { id: stockItemId, farmId: user.farmId },
    });
    if (!stockItem) throw new ApiError(404, "Stock item not found");

    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          ...data,
          stockItemId,
          stockItemName: data.stockItemName || stockItem.name,
          operator: data.operator || user.name,
          operatorId: user.id,
        } as Prisma.StockAdjustmentUncheckedCreateInput,
      });

      if (typeof data.delta === "number") {
        await tx.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: { increment: data.delta },
            updatedAt: new Date().toISOString().slice(0, 10),
          },
        });
      }

      return adjustment;
    });
  }

  if (entity === "sales") {
    const items = Array.isArray(data.items)
      ? data.items.map(toSaleItemInput)
      : [];
    delete data.items;
    if (items.length === 0) throw new ApiError(400, "Sale items are required");

    return prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: String(item.productId), farmId: user.farmId },
          data: { stock: { decrement: Number(item.qty) } },
        });
      }

      return tx.saleRecord.create({
        data: {
          ...data,
          farmId: user.farmId,
          items: {
            create: items,
          },
        } as Prisma.SaleRecordUncheckedCreateInput,
        include: { items: true },
      });
    });
  }

  return farmDb[config.model].create({
    data:
      config.scopedBy === "farmId"
        ? { ...data, farmId: user.farmId }
        : data,
    include: config.include,
  });
}

export async function updateFarmEntity(
  entity: string,
  id: string,
  body: Record<string, unknown>,
  user: AuthUser,
) {
  const config = getEntityConfig(entity);
  const existing = await farmDb[config.model].findFirst({
    where: whereForScope(config, user.farmId, id),
  });
  if (!existing) throw new ApiError(404, "Record not found");

  const data = cleanBody(body);

  if (entity === "fields") {
    delete data.rotation;
  }

  return farmDb[config.model].update({
    where: { id },
    data,
    include: config.include,
  });
}

export async function deleteFarmEntity(
  entity: string,
  id: string,
  user: AuthUser,
) {
  const config = getEntityConfig(entity);
  const existing = await farmDb[config.model].findFirst({
    where: whereForScope(config, user.farmId, id),
  });
  if (!existing) throw new ApiError(404, "Record not found");

  await farmDb[config.model].delete({ where: { id } });
  return { ok: true };
}
