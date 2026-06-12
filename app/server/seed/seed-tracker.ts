import "server-only";

import { prisma } from "@/app/lib/prisma";

export type ViabilityPoint = {
  date: string;
  germinationPercent: number;
  seedsTested: number;
  daysSincePurchase: number;
};

export type SeedInventoryItem = {
  id: string;
  crop: string;
  variety: string | null;
  lotNumber: string;
  quantity: number;
  unit: string;
  baselineGermination: number | null;
  latestGermination: number | null;
  testCount: number;
  totalConsigned: number;
  remainingQuantity: number;
  treatmentType: string;
  purchaseDate: string | null;
};

export async function getViabilityCurve(
  seedLotId: string,
): Promise<ViabilityPoint[]> {
  const lot = await prisma.seedLot.findUnique({
    where: { id: seedLotId },
    select: { purchaseDate: true },
  });

  const tests = await prisma.germinationTest.findMany({
    where: { seedLotId },
    orderBy: { testDate: "asc" },
  });

  const purchaseTime = lot?.purchaseDate
    ? new Date(`${lot.purchaseDate}T00:00:00`).getTime()
    : Date.now();

  return tests.map((t) => ({
    date: t.testDate,
    germinationPercent: t.germinationPercent,
    seedsTested: t.seedsTested,
    daysSincePurchase: lot?.purchaseDate
      ? Math.round(
          (new Date(`${t.testDate}T00:00:00`).getTime() - purchaseTime) /
            86400000,
        )
      : 0,
  }));
}

export async function getSeedInventory(
  farmId: string,
): Promise<SeedInventoryItem[]> {
  const lots = await prisma.seedLot.findMany({
    where: { farmId },
    include: {
      germinationTests: {
        orderBy: { testDate: "desc" },
        take: 1,
      },
      consignments: {
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return lots.map((lot) => {
    const totalConsigned = lot.consignments.reduce(
      (s, c) => s + c.quantity,
      0,
    );
    return {
      id: lot.id,
      crop: lot.crop,
      variety: lot.variety,
      lotNumber: lot.lotNumber,
      quantity: lot.quantity,
      unit: lot.unit,
      baselineGermination: lot.baselineGermination,
      latestGermination:
        lot.germinationTests.length > 0
          ? lot.germinationTests[0].germinationPercent
          : null,
      testCount: 0,
      totalConsigned,
      remainingQuantity: Math.max(0, lot.quantity - totalConsigned),
      treatmentType: lot.treatmentType,
      purchaseDate: lot.purchaseDate,
    };
  });
}

export async function computeGerminationDecline(
  seedLotId: string,
): Promise<{ declineRatePerMonth: number; projectedViability: number | null }> {
  const tests = await prisma.germinationTest.findMany({
    where: { seedLotId },
    orderBy: { testDate: "asc" },
  });

  if (tests.length < 2) {
    return { declineRatePerMonth: 0, projectedViability: null };
  }

  const first = tests[0];
  const last = tests[tests.length - 1];
  const daysDiff =
    (new Date(`${last.testDate}T00:00:00`).getTime() -
      new Date(`${first.testDate}T00:00:00`).getTime()) /
    86400000;
  const monthsDiff = daysDiff / 30;
  const percentDiff = first.germinationPercent - last.germinationPercent;
  const declineRatePerMonth =
    monthsDiff > 0 ? percentDiff / monthsDiff : 0;

  const projectedViability = Math.max(
    0,
    last.germinationPercent - declineRatePerMonth * 3,
  );

  return {
    declineRatePerMonth: Math.round(declineRatePerMonth * 10) / 10,
    projectedViability: Math.round(projectedViability * 10) / 10,
  };
}
