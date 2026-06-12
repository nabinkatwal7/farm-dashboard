import "server-only";

import { prisma } from "@/app/lib/prisma";

export type WaterTableTrendPoint = {
  date: string;
  depthToWater: number;
  wellName?: string;
};

export type MoistureProfilePoint = {
  zoneName: string;
  depthFrom: number;
  depthTo: number;
  avgMoisture: number;
  latestMoisture: number;
  recordCount: number;
};

export type IrrigationSummary = {
  totalAppliedMm: number;
  eventCount: number;
  byMethod: Record<string, number>;
  avgAmountPerEvent: number;
  totalDurationHours: number;
};

export type WaterBudgetResult = {
  totalIrrigationMm: number;
  totalPrecipitationMm: number;
  totalInputMm: number;
  estimatedEtMm: number;
  netWaterMm: number;
  deficitSurplusMm: number;
  season: number;
  fieldId: string;
};

export async function getWaterTableTrend(
  farmId: string,
  fieldId?: string,
  limit = 90,
): Promise<WaterTableTrendPoint[]> {
  const where: Record<string, unknown> = { farmId };
  if (fieldId) where.fieldId = fieldId;

  const readings = await prisma.waterTableReading.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: limit,
  });

  return readings.map((r) => ({
    date: r.timestamp,
    depthToWater: r.depthToWater,
    wellName: r.wellName ?? undefined,
  }));
}

export async function getMoistureProfile(
  fieldId: string,
): Promise<MoistureProfilePoint[]> {
  const zones = await prisma.soilZone.findMany({
    where: { fieldId },
    include: {
      records: {
        orderBy: { timestamp: "desc" },
        take: 30,
      },
    },
  });

  return zones.map((zone) => {
    const moistures = zone.records.map((r) => r.moisturePercent);
    const avgMoisture =
      moistures.length > 0
        ? moistures.reduce((s, v) => s + v, 0) / moistures.length
        : 0;
    return {
      zoneName: zone.name,
      depthFrom: zone.depthFrom,
      depthTo: zone.depthTo,
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      latestMoisture:
        zone.records.length > 0
          ? zone.records[0].moisturePercent
          : 0,
      recordCount: zone.records.length,
    };
  });
}

export async function getIrrigationSummary(
  fieldId: string,
  seasonStart: string,
): Promise<IrrigationSummary> {
  const events = await prisma.irrigationEvent.findMany({
    where: {
      fieldId,
      date: { gte: seasonStart },
    },
    orderBy: { date: "asc" },
  });

  const byMethod: Record<string, number> = {};
  let totalDuration = 0;

  for (const event of events) {
    byMethod[event.method] = (byMethod[event.method] ?? 0) + event.amountMm;
    totalDuration += event.durationHours ?? 0;
  }

  return {
    totalAppliedMm: events.reduce((s, e) => s + e.amountMm, 0),
    eventCount: events.length,
    byMethod,
    avgAmountPerEvent:
      events.length > 0
        ? events.reduce((s, e) => s + e.amountMm, 0) / events.length
        : 0,
    totalDurationHours: totalDuration,
  };
}

export async function calculateWaterBudget(
  fieldId: string,
  season: number,
): Promise<WaterBudgetResult> {
  const field = await prisma.cropField.findUnique({
    where: { id: fieldId },
    select: { farmId: true, sowDate: true },
  });
  if (!field) {
    return {
      totalIrrigationMm: 0,
      totalPrecipitationMm: 0,
      totalInputMm: 0,
      estimatedEtMm: 0,
      netWaterMm: 0,
      deficitSurplusMm: 0,
      season,
      fieldId,
    };
  }

  const seasonStart = `${season}-01-01`;
  const seasonEnd = `${season}-12-31`;

  const events = await prisma.irrigationEvent.findMany({
    where: { fieldId, date: { gte: seasonStart, lte: seasonEnd } },
  });
  const totalIrrigationMm = events.reduce((s, e) => s + e.amountMm, 0);

  const farmStations = await prisma.weatherStation.findMany({
    where: { farmId: field.farmId, isActive: true },
    select: { id: true },
  });
  const stationIds = farmStations.map((s) => s.id);

  let totalPrecipitationMm = 0;
  if (stationIds.length > 0) {
    const weather = await prisma.weatherRecord.findMany({
      where: {
        stationId: { in: stationIds },
        timestamp: { gte: seasonStart, lte: seasonEnd },
        precipitation: { not: null },
      },
    });
    totalPrecipitationMm = weather.reduce(
      (s, r) => s + (r.precipitation ?? 0),
      0,
    );
  }

  const totalInputMm = totalIrrigationMm + totalPrecipitationMm;

  const weatherTemps = stationIds.length > 0
    ? await prisma.weatherRecord.findMany({
        where: {
          stationId: { in: stationIds },
          timestamp: { gte: seasonStart, lte: seasonEnd },
          temperatureMax: { not: null },
        },
      })
    : [];
  const avgTemp =
    weatherTemps.length > 0
      ? weatherTemps.reduce((s, r) => s + (r.temperatureMax ?? 0), 0) /
        weatherTemps.length
      : 15;

  const estimatedEtMm = avgTemp * 2.5;

  const netWaterMm = totalInputMm - estimatedEtMm;
  const deficitSurplusMm = totalInputMm - estimatedEtMm;

  return {
    totalIrrigationMm,
    totalPrecipitationMm: Math.round(totalPrecipitationMm * 10) / 10,
    totalInputMm: Math.round(totalInputMm * 10) / 10,
    estimatedEtMm: Math.round(estimatedEtMm * 10) / 10,
    netWaterMm: Math.round(netWaterMm * 10) / 10,
    deficitSurplusMm: Math.round(deficitSurplusMm * 10) / 10,
    season,
    fieldId,
  };
}
