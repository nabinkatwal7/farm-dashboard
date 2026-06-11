import "server-only";

import { Prisma } from "@prisma/client";
import { ApiError } from "./api";
import type { AuthUser } from "./auth";
import { prisma } from "./prisma";

type EntityConfig = {
  model: string;
  scopedBy: "farmId" | "field" | "animal" | "stockItem";
  include?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
};

type DynamicModelDelegate = {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown | null>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

type RotationInput = {
  year: number;
  crop: string;
};

type SaleItemInput = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

const ENTITIES: Record<string, EntityConfig> = {
  fields: {
    model: "cropField",
    scopedBy: "farmId",
    include: { rotation: true },
    orderBy: { name: "asc" },
  },
  inputLogs: {
    model: "inputLog",
    scopedBy: "field",
    orderBy: { date: "desc" },
  },
  yieldRecords: {
    model: "yieldRecord",
    scopedBy: "field",
    orderBy: { year: "desc" },
  },
  animals: {
    model: "animal",
    scopedBy: "farmId",
    orderBy: { earTag: "asc" },
  },
  medicalRecords: {
    model: "medicalRecord",
    scopedBy: "animal",
    orderBy: { date: "desc" },
  },
  breedingRecords: {
    model: "breedingRecord",
    scopedBy: "farmId",
    orderBy: { expectedBirth: "asc" },
  },
  weightRecords: {
    model: "weightRecord",
    scopedBy: "animal",
    orderBy: { date: "desc" },
  },
  stockItems: {
    model: "stockItem",
    scopedBy: "farmId",
    orderBy: { name: "asc" },
  },
  stockAdjustments: {
    model: "stockAdjustment",
    scopedBy: "stockItem",
    orderBy: { date: "desc" },
  },
  batches: {
    model: "batchRecord",
    scopedBy: "farmId",
    orderBy: { processedDate: "desc" },
  },
  products: {
    model: "product",
    scopedBy: "farmId",
    orderBy: { name: "asc" },
  },
  sales: {
    model: "saleRecord",
    scopedBy: "farmId",
    include: { items: true },
    orderBy: { date: "desc" },
  },
  machines: {
    model: "machine",
    scopedBy: "farmId",
    orderBy: { name: "asc" },
  },
  tasks: {
    model: "task",
    scopedBy: "farmId",
    orderBy: { dueDate: "asc" },
  },
  expenses: {
    model: "expenseRecord",
    scopedBy: "farmId",
    orderBy: { date: "desc" },
  },
};

const db = prisma as unknown as Record<string, DynamicModelDelegate>;

function entityConfig(entity: string) {
  const config = ENTITIES[entity];
  if (!config) throw new ApiError(404, `Unknown farm entity: ${entity}`);
  return config;
}

function cleanBody(body: Record<string, unknown>) {
  const {
    id,
    farmId,
    createdAt,
    updatedAt,
    farm,
    field,
    animal,
    stockItem,
    sale,
    product,
    operatorUser,
    assigneeUser,
    ...data
  } = body;
  void id;
  void farmId;
  void createdAt;
  void updatedAt;
  void farm;
  void field;
  void animal;
  void stockItem;
  void sale;
  void product;
  void operatorUser;
  void assigneeUser;
  return data;
}

function whereForScope(config: EntityConfig, farmId: string, id?: string) {
  const idFilter = id ? { id } : {};

  if (config.scopedBy === "farmId") {
    return { ...idFilter, farmId };
  }

  if (config.scopedBy === "field") {
    return { ...idFilter, field: { farmId } };
  }

  if (config.scopedBy === "animal") {
    return { ...idFilter, animal: { farmId } };
  }

  return { ...idFilter, stockItem: { farmId } };
}

function toRotationInput(item: unknown): RotationInput {
  if (!item || typeof item !== "object") {
    throw new ApiError(400, "Invalid rotation record");
  }

  const record = item as Record<string, unknown>;
  return {
    year: Number(record.year),
    crop: String(record.crop ?? ""),
  };
}

function toSaleItemInput(item: unknown): SaleItemInput {
  if (!item || typeof item !== "object") {
    throw new ApiError(400, "Invalid sale item");
  }

  const record = item as Record<string, unknown>;
  const saleItem = {
    productId: String(record.productId ?? ""),
    name: String(record.name ?? ""),
    qty: Number(record.qty),
    price: Number(record.price),
  };

  if (!saleItem.productId || !saleItem.name || !Number.isFinite(saleItem.qty)) {
    throw new ApiError(400, "Invalid sale item");
  }

  return saleItem;
}

async function getField(fieldId: unknown, user: AuthUser) {
  if (typeof fieldId !== "string" || !fieldId) {
    throw new ApiError(400, "fieldId is required");
  }

  const field = await prisma.cropField.findFirst({
    where: { id: fieldId, farmId: user.farmId },
  });
  if (!field) throw new ApiError(404, "Field not found");
  return field;
}

async function getAnimalByEarTag(earTag: unknown, user: AuthUser) {
  if (typeof earTag !== "string" || !earTag) {
    throw new ApiError(400, "earTag is required");
  }

  const animal = await prisma.animal.findFirst({
    where: { earTag, farmId: user.farmId },
  });
  if (!animal) throw new ApiError(404, "Animal not found");
  return animal;
}

export async function listFarmEntity(entity: string, user: AuthUser) {
  const config = entityConfig(entity);
  return db[config.model].findMany({
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
  const config = entityConfig(entity);
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

  return db[config.model].create({
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
  const config = entityConfig(entity);
  const existing = await db[config.model].findFirst({
    where: whereForScope(config, user.farmId, id),
  });
  if (!existing) throw new ApiError(404, "Record not found");

  const data = cleanBody(body);

  if (entity === "fields") {
    delete data.rotation;
  }

  return db[config.model].update({
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
  const config = entityConfig(entity);
  const existing = await db[config.model].findFirst({
    where: whereForScope(config, user.farmId, id),
  });
  if (!existing) throw new ApiError(404, "Record not found");

  await db[config.model].delete({ where: { id } });
  return { ok: true };
}
