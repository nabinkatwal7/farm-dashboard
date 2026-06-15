import { ok, fail, requireEntityAccess, readJson } from "@/app/lib/api";
import { syncAll, syncAnimalRegistration, syncBirth, syncDeath } from "@/app/server/livestock/traceability-engine";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("livestockIntegrations", "write");
    const body = await readJson<{ action: string; animalId?: string; integrationId: string }>(request);
    const { action, animalId, integrationId } = body;

    if (!integrationId) {
      return fail({ status: 400, message: "integrationId is required" });
    }

    let result: unknown;
    switch (action) {
      case "syncAll":
        result = await syncAll(user.farmId, integrationId);
        break;
      case "syncAnimal":
        if (!animalId) return fail({ status: 400, message: "animalId is required" });
        result = await syncAnimalRegistration(user.farmId, animalId, integrationId);
        break;
      case "syncBirth":
        if (!animalId) return fail({ status: 400, message: "animalId is required" });
        result = await syncBirth(user.farmId, animalId, integrationId);
        break;
      case "syncDeath":
        if (!animalId) return fail({ status: 400, message: "animalId is required" });
        result = await syncDeath(user.farmId, animalId, integrationId);
        break;
      default:
        return fail({ status: 400, message: `Unknown action: ${action}` });
    }

    return ok({ result });
  } catch (error) {
    return fail(error);
  }
}
