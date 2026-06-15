import "server-only";
import { prisma } from "@/app/lib/prisma";

export type TagReadResult = {
  id: string;
  earTag: string;
  status: "matched" | "unmatched";
  animalId?: string;
  animalEarTag?: string;
};

function generateDeviceId(): string {
  const ids = ["BT-WAND-A7F3", "BT-WAND-B2C8", "BT-WAND-D4E1", "BT-WAND-F9A6"];
  return ids[Math.floor(Math.random() * ids.length)];
}

export async function processTagRead(farmId: string, sessionId: string, earTag: string): Promise<TagReadResult> {
  const session = await prisma.rFIDScanSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "active") {
    throw new Error("Session is not active");
  }

  const existingRead = await prisma.rFIDTagRead.findFirst({
    where: { sessionId, earTag },
  });

  if (existingRead) {
    return {
      id: existingRead.id,
      earTag: existingRead.earTag,
      status: existingRead.status as "matched" | "unmatched",
      animalId: existingRead.animalId ?? undefined,
      animalEarTag: existingRead.animalEarTag ?? undefined,
    };
  }

  const animal = await prisma.animal.findFirst({
    where: { farmId, earTag },
  });

  const status = animal ? "matched" : "unmatched";

  const tagRead = await prisma.rFIDTagRead.create({
    data: {
      sessionId,
      farmId,
      earTag,
      timestamp: new Date().toISOString(),
      status,
      animalId: animal?.id,
      animalEarTag: animal?.earTag,
      deviceId: generateDeviceId(),
    },
  });

  await updateSessionCounts(sessionId);

  return {
    id: tagRead.id,
    earTag: tagRead.earTag,
    status: tagRead.status as "matched" | "unmatched",
    animalId: tagRead.animalId ?? undefined,
    animalEarTag: tagRead.animalEarTag ?? undefined,
  };
}

async function updateSessionCounts(sessionId: string) {
  const [totalScans, matchedCount, unmatchedCount] = await Promise.all([
    prisma.rFIDTagRead.count({ where: { sessionId } }),
    prisma.rFIDTagRead.count({ where: { sessionId, status: "matched" } }),
    prisma.rFIDTagRead.count({ where: { sessionId, status: "unmatched" } }),
  ]);

  await prisma.rFIDScanSession.update({
    where: { id: sessionId },
    data: { totalScans, matchedCount, unmatchedCount },
  });
}

export async function completeSession(sessionId: string) {
  const session = await prisma.rFIDScanSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");

  await updateSessionCounts(sessionId);

  return prisma.rFIDScanSession.update({
    where: { id: sessionId },
    data: { status: "completed" },
  });
}

export async function processBulkScan(farmId: string, sessionId: string, earTags: string[]): Promise<TagReadResult[]> {
  const results: TagReadResult[] = [];
  for (const earTag of earTags) {
    const result = await processTagRead(farmId, sessionId, earTag.trim());
    results.push(result);
  }
  return results;
}
