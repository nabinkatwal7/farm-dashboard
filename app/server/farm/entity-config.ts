import "server-only";

import { ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export type EntityScope = "farmId" | "field" | "animal" | "stockItem";

export type EntityConfig = {
  model: string;
  scopedBy: EntityScope;
  include?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
};

export type DynamicModelDelegate = {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown | null>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
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
  prescriptionMaps: {
    model: "prescriptionMap",
    scopedBy: "field",
    include: { zones: true },
    orderBy: { createdAt: "desc" },
  },
  seedIntegrations: {
    model: "seedIntegration",
    scopedBy: "farmId",
    orderBy: { label: "asc" },
  },
  weatherStations: {
    model: "weatherStation",
    scopedBy: "farmId",
    orderBy: { name: "asc" },
  },
  weatherRecords: {
    model: "weatherRecord",
    scopedBy: "farmId",
    orderBy: { timestamp: "desc" },
  },
  cropModels: {
    model: "cropModel",
    scopedBy: "farmId",
    orderBy: { crop: "asc" },
  },
  gddRecords: {
    model: "gDDRecord",
    scopedBy: "farmId",
    orderBy: { date: "desc" },
  },
  growthStageForecasts: {
    model: "growthStageForecast",
    scopedBy: "farmId",
    orderBy: { forecastDate: "asc" },
  },
};

export const farmDb = prisma as unknown as Record<string, DynamicModelDelegate>;

export function getEntityConfig(entity: string) {
  const config = ENTITIES[entity];
  if (!config) throw new ApiError(404, `Unknown farm entity: ${entity}`);
  return config;
}
