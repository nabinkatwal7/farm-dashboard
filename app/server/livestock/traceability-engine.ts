import "server-only";
import { prisma } from "@/app/lib/prisma";

function generateNationalId(earTag: string, provider: string): string {
  const prefix = provider === "bcms" ? "UK" : provider === "nlis" ? "AU" : "XX";
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}${earTag.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase()}${ts}`;
}

type SyncResult = {
  synced: number;
  failed: number;
  records: Array<{ earTag: string; eventType: string; status: string; nationalId?: string; error?: string }>;
};

export async function syncAnimalRegistration(farmId: string, animalId: string, integrationId: string): Promise<SyncResult["records"][0]> {
  const animal = await prisma.animal.findUnique({ where: { id: animalId } });
  if (!animal) return { earTag: "unknown", eventType: "registration", status: "failed", error: "Animal not found" };

  const integration = await prisma.livestockIntegration.findUnique({ where: { id: integrationId } });
  const provider = integration?.provider ?? "agri";

  const nationalId = generateNationalId(animal.earTag, provider);
  const payload = JSON.stringify({
    earTag: animal.earTag,
    species: animal.species,
    breed: animal.breed,
    sex: animal.sex,
    dob: animal.dob,
    herdMark: integration?.herdMark ?? null,
  });

  try {
    await prisma.livestockSyncRecord.create({
      data: {
        farmId,
        eventType: "registration",
        animalId: animal.id,
        animalEarTag: animal.earTag,
        status: "synced",
        requestPayload: payload,
        responseData: JSON.stringify({ nationalId, registeredAt: new Date().toISOString() }),
        syncedAt: new Date().toISOString(),
      },
    });
    return { earTag: animal.earTag, eventType: "registration", status: "synced", nationalId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.livestockSyncRecord.create({
      data: {
        farmId,
        eventType: "registration",
        animalId: animal.id,
        animalEarTag: animal.earTag,
        status: "failed",
        requestPayload: payload,
        errorMessage: msg,
      },
    });
    return { earTag: animal.earTag, eventType: "registration", status: "failed", error: msg };
  }
}

export async function syncBirth(farmId: string, animalId: string, integrationId: string): Promise<SyncResult["records"][0]> {
  const animal = await prisma.animal.findUnique({ where: { id: animalId } });
  if (!animal) return { earTag: "unknown", eventType: "birth", status: "failed", error: "Animal not found" };

  const integration = await prisma.livestockIntegration.findUnique({ where: { id: integrationId } });
  const provider = integration?.provider ?? "agri";
  const nationalId = generateNationalId(animal.earTag, provider);
  const payload = JSON.stringify({ earTag: animal.earTag, species: animal.species, dob: animal.dob, damEarTag: null });

  try {
    await prisma.livestockSyncRecord.create({
      data: {
        farmId,
        eventType: "birth",
        animalId: animal.id,
        animalEarTag: animal.earTag,
        status: "synced",
        requestPayload: payload,
        responseData: JSON.stringify({ nationalId, birthRegisteredAt: new Date().toISOString() }),
        syncedAt: new Date().toISOString(),
      },
    });
    return { earTag: animal.earTag, eventType: "birth", status: "synced", nationalId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.livestockSyncRecord.create({
      data: { farmId, eventType: "birth", animalId: animal.id, animalEarTag: animal.earTag, status: "failed", requestPayload: payload, errorMessage: msg },
    });
    return { earTag: animal.earTag, eventType: "birth", status: "failed", error: msg };
  }
}

export async function syncDeath(farmId: string, animalId: string, integrationId: string): Promise<SyncResult["records"][0]> {
  const animal = await prisma.animal.findUnique({ where: { id: animalId } });
  if (!animal) return { earTag: "unknown", eventType: "death", status: "failed", error: "Animal not found" };

  const payload = JSON.stringify({ earTag: animal.earTag, species: animal.species, status: animal.status });
  try {
    await prisma.livestockSyncRecord.create({
      data: {
        farmId,
        eventType: "death",
        animalId: animal.id,
        animalEarTag: animal.earTag,
        status: "synced",
        requestPayload: payload,
        responseData: JSON.stringify({ confirmed: true, deregisteredAt: new Date().toISOString() }),
        syncedAt: new Date().toISOString(),
      },
    });
    return { earTag: animal.earTag, eventType: "death", status: "synced" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.livestockSyncRecord.create({
      data: { farmId, eventType: "death", animalId: animal.id, animalEarTag: animal.earTag, status: "failed", requestPayload: payload, errorMessage: msg },
    });
    return { earTag: animal.earTag, eventType: "death", status: "failed", error: msg };
  }
}

export async function syncAll(farmId: string, integrationId: string): Promise<SyncResult> {
  const animals = await prisma.animal.findMany({ where: { farmId } });
  const results: SyncResult = { synced: 0, failed: 0, records: [] };

  for (const animal of animals) {
    if (animal.status === "deceased") {
      const r = await syncDeath(farmId, animal.id, integrationId);
      results.records.push(r);
      if (r.status === "synced") results.synced++; else results.failed++;
    } else {
      const r = await syncAnimalRegistration(farmId, animal.id, integrationId);
      results.records.push(r);
      if (r.status === "synced") results.synced++; else results.failed++;
    }
  }

  await prisma.livestockIntegration.update({
    where: { id: integrationId },
    data: { lastSyncAt: new Date().toISOString(), lastSyncStatus: results.failed === 0 ? "synced" : "partial" },
  });

  return results;
}
