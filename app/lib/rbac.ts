import "server-only";

import type { AuthUser } from "./auth";

export const ROLES = [
  "ADMIN",
  "FARM_MANAGER",
  "FIELD_WORKER",
  "LIVESTOCK_MANAGER",
  "INVENTORY_MANAGER",
  "SHOP_STAFF",
  "ACCOUNTANT",
  "VETERINARY",
  "VIEWER",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  FARM_MANAGER: "Farm Manager",
  FIELD_WORKER: "Field Worker",
  LIVESTOCK_MANAGER: "Livestock Manager",
  INVENTORY_MANAGER: "Inventory Manager",
  SHOP_STAFF: "Shop Staff",
  ACCOUNTANT: "Accountant",
  VETERINARY: "Veterinary",
  VIEWER: "Viewer",
};

const ACCESS: Record<string, { read: Role[]; write: Role[] }> = {
  fields: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  inputLogs: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  yieldRecords: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "ACCOUNTANT", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  animals: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "LIVESTOCK_MANAGER",
      "VETERINARY",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER"],
  },
  medicalRecords: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "LIVESTOCK_MANAGER",
      "VETERINARY",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY"],
  },
  breedingRecords: {
    read: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER"],
  },
  weightRecords: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "LIVESTOCK_MANAGER",
      "VETERINARY",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY"],
  },
  stockItems: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "INVENTORY_MANAGER"],
  },
  stockAdjustments: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "INVENTORY_MANAGER"],
  },
  batches: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "INVENTORY_MANAGER"],
  },
  products: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
      "ACCOUNTANT",
      "VIEWER",
    ],
    write: ["ADMIN", "FARM_MANAGER", "INVENTORY_MANAGER", "SHOP_STAFF"],
  },
  sales: {
    read: ["ADMIN", "FARM_MANAGER", "SHOP_STAFF", "ACCOUNTANT", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "SHOP_STAFF"],
  },
  machines: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  tasks: {
    read: [
      "ADMIN",
      "FARM_MANAGER",
      "FIELD_WORKER",
      "LIVESTOCK_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
      "VIEWER",
    ],
    write: [
      "ADMIN",
      "FARM_MANAGER",
      "FIELD_WORKER",
      "LIVESTOCK_MANAGER",
      "INVENTORY_MANAGER",
      "SHOP_STAFF",
    ],
  },
  expenses: {
    read: ["ADMIN", "FARM_MANAGER", "ACCOUNTANT", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "ACCOUNTANT"],
  },
  prescriptionMaps: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },

  seedIntegrations: {
    read: ["ADMIN", "FARM_MANAGER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  weatherStations: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  weatherRecords: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  cropModels: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  gddRecords: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  growthStageForecasts: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  soilZones: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  soilMoistureRecords: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  waterTableReadings: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  irrigationEvents: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  seedLots: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  germinationTests: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  consignments: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  droneFlights: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  orthomosaicMaps: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  scoutingObservations: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  drydownBatches: {
    read: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "FIELD_WORKER"],
  },
  livestockIntegrations: {
    read: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  livestockSyncRecords: {
    read: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER"],
  },
  rfidScanSessions: {
    read: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER"],
  },
  rfidTagReads: {
    read: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER", "VETERINARY", "VIEWER"],
    write: ["ADMIN", "FARM_MANAGER", "LIVESTOCK_MANAGER"],
  },
};

export function canAccess(
  user: AuthUser,
  entity: string,
  action: "read" | "write"
) {
  if (user.role === "ADMIN") return true;
  const config = ACCESS[entity];
  if (!config) return false;
  return config[action].includes(user.role as Role);
}

export function canManageUsers(user: AuthUser) {
  return user.role === "ADMIN" || user.role === "FARM_MANAGER";
}
