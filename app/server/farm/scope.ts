import "server-only";

import type { EntityConfig } from "./entity-config";

export function whereForScope(config: EntityConfig, farmId: string, id?: string) {
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
