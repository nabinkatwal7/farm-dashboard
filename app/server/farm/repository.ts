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

type BoundaryPoint = { lat: number; lng: number };
const FIELD_STATUSES = new Set(["planted", "growing", "harvested", "fallow"]);

function isBoundaryPoint(value: unknown): value is BoundaryPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng)
  );
}

function serializeBoundary(value: unknown) {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(value.filter(isBoundaryPoint));
}

function parseFieldBoundary<T extends Record<string, unknown>>(field: T) {
  const raw = field.boundary;
  if (typeof raw !== "string") return { ...field, boundary: [] };

  try {
    const parsed = JSON.parse(raw) as unknown;
    return {
      ...field,
      boundary: Array.isArray(parsed) ? parsed.filter(isBoundaryPoint) : [],
    };
  } catch {
    return { ...field, boundary: [] };
  }
}

function normalizeFieldData(data: Record<string, unknown>) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const acres = Number(data.acres);
  const currentCrop =
    typeof data.currentCrop === "string" ? data.currentCrop.trim() : "";
  const status = typeof data.status === "string" ? data.status : "planted";
  const sowDate = typeof data.sowDate === "string" ? data.sowDate : "";
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  const harvestDate =
    typeof data.harvestDate === "string" && data.harvestDate.trim()
      ? data.harvestDate
      : null;

  if (!name) throw new ApiError(400, "Field name is required");
  if (!Number.isFinite(acres) || acres <= 0) {
    throw new ApiError(400, "Valid acreage is required");
  }
  if (!currentCrop) throw new ApiError(400, "Current crop is required");
  if (!FIELD_STATUSES.has(status)) {
    throw new ApiError(400, "Field status is invalid");
  }
  if (!sowDate) throw new ApiError(400, "Sow date is required");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "Field boundary is required");
  }
  if (
    !Array.isArray(data.boundary) ||
    data.boundary.filter(isBoundaryPoint).length < 3
  ) {
    throw new ApiError(400, "Mark at least 3 boundary points on the map");
  }

  data.name = name;
  data.acres = acres;
  data.currentCrop = currentCrop;
  data.status = status;
  data.sowDate = sowDate;
  data.harvestDate = harvestDate;
  data.lat = lat;
  data.lng = lng;
}

export async function listFarmEntity(entity: string, user: AuthUser) {
  const config = getEntityConfig(entity);
  const records = await farmDb[config.model].findMany({
    where: whereForScope(config, user.farmId),
    include: config.include,
    orderBy: config.orderBy,
  });
  if (entity === "fields") {
    return records.map((record) =>
      parseFieldBoundary(record as Record<string, unknown>),
    );
  }
  return records;
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
    normalizeFieldData(data);
    data.boundary = serializeBoundary(data.boundary);
    delete data.rotation;
    const field = await prisma.cropField.create({
      data: {
        ...data,
        farmId: user.farmId,
        rotation: {
          create: rotation.map(toRotationInput),
        },
      } as Prisma.CropFieldUncheckedCreateInput,
      include: { rotation: true },
    });
    return parseFieldBoundary(field as unknown as Record<string, unknown>);
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

  if (entity === "prescriptionMaps") {
    const zones = Array.isArray(data.zones) ? data.zones : [];
    delete data.zones;
    return prisma.prescriptionMap.create({
      data: {
        ...data,
        farmId: user.farmId,
        zones: {
          create: zones.map((z: Record<string, unknown>) => ({
            name: String(z.name ?? ""),
            rate: Number(z.rate),
            areaAcres: Number(z.areaAcres),
            lat: Number(z.lat),
            lng: Number(z.lng),
            color: String(z.color ?? "#4ade80"),
          })),
        },
      } as Prisma.PrescriptionMapUncheckedCreateInput,
      include: { zones: true },
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
    data.boundary = serializeBoundary(data.boundary);
    delete data.rotation;
  }

  if (entity === "prescriptionMaps") {
    delete data.zones;
  }

  const updated = await farmDb[config.model].update({
    where: { id },
    data,
    include: config.include,
  });
  if (entity === "fields") {
    return parseFieldBoundary(updated as Record<string, unknown>);
  }
  return updated;
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
