import "server-only";

import { prisma } from "@/app/lib/prisma";

export type GrowthStage =
  | "germination"
  | "emergence"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "maturity";

const STAGE_ORDER: GrowthStage[] = [
  "germination",
  "emergence",
  "vegetative",
  "flowering",
  "fruiting",
  "maturity",
];

export function computeDailyGDD(
  tmin: number,
  tmax: number,
  baseTemp: number,
  maxTemp: number
): number {
  const cappedMax = Math.min(tmax, maxTemp);
  const flooredMin = Math.max(tmin, baseTemp);
  const avg = (cappedMax + flooredMin) / 2;
  return Math.max(0, avg - baseTemp);
}

export function getStageGddThreshold(model: {
  gddToGermination?: number | null;
  gddToEmergence?: number | null;
  gddToVegetative?: number | null;
  gddToFlowering?: number | null;
  gddToFruiting?: number | null;
  gddToMaturity?: number | null;
}): Record<GrowthStage, number | null> {
  return {
    germination: model.gddToGermination ?? null,
    emergence: model.gddToEmergence ?? null,
    vegetative: model.gddToVegetative ?? null,
    flowering: model.gddToFlowering ?? null,
    fruiting: model.gddToFruiting ?? null,
    maturity: model.gddToMaturity ?? null,
  };
}

export function determineCurrentStage(
  cumulativeGdd: number,
  stageThresholds: Record<GrowthStage, number | null>
): {
  currentStage: GrowthStage;
  progress: number;
  nextStage: GrowthStage | null;
} {
  const thresholds = STAGE_ORDER.map((s) => ({
    stage: s,
    threshold: stageThresholds[s],
  }));
  const reached = thresholds.filter(
    (t) => t.threshold !== null && cumulativeGdd >= t.threshold
  );
  const lastReached = reached[reached.length - 1];
  const currentStage = lastReached ? lastReached.stage : thresholds[0].stage;
  const next = thresholds.find(
    (t) => t.threshold !== null && cumulativeGdd < t.threshold
  );
  const nextStage = next ? next.stage : null;
  const nextThreshold =
    next?.threshold ?? thresholds[thresholds.length - 1].threshold ?? 0;
  const prevThreshold = lastReached?.threshold ?? 0;
  const range = nextThreshold - prevThreshold;
  const progress =
    range > 0 ? Math.min(1, (cumulativeGdd - prevThreshold) / range) : 1;
  return { currentStage, progress, nextStage };
}

export function forecastStageDate(
  currentDate: Date,
  cumulativeGdd: number,
  targetGdd: number,
  historicalDailyGdd: number,
  forecastDailyGdd: number
): Date {
  const remainingGdd = Math.max(0, targetGdd - cumulativeGdd);
  if (remainingGdd <= 0) return currentDate;
  const blendedRate =
    historicalDailyGdd > 0
      ? historicalDailyGdd * 0.4 + forecastDailyGdd * 0.6
      : forecastDailyGdd;
  const daysNeeded =
    blendedRate > 0 ? Math.ceil(remainingGdd / blendedRate) : 999;
  const forecast = new Date(currentDate);
  forecast.setDate(forecast.getDate() + Math.min(daysNeeded, 365));
  return forecast;
}

export async function computeSeasonGDD(
  fieldId: string,
  season: number,
  baseTemp: number,
  maxTemp: number,
  sowDateStr: string
) {
  const sowDate = new Date(`${sowDateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRecords = await prisma.gDDRecord.findMany({
    where: { fieldId, season },
    orderBy: { date: "asc" },
  });

  if (existingRecords.length > 0) {
    const lastRecord = existingRecords[existingRecords.length - 1];
    return {
      records: existingRecords,
      cumulativeGdd: lastRecord.cumulativeGDD,
      lastDate: lastRecord.date,
    };
  }

  const field = await prisma.cropField.findUnique({
    where: { id: fieldId },
    select: { farmId: true },
  });
  if (!field) return { records: [], cumulativeGdd: 0, lastDate: sowDateStr };

  const farmStations = await prisma.weatherStation.findMany({
    where: { farmId: field.farmId, isActive: true },
    select: { id: true },
  });
  const stationIds = farmStations.map((s) => s.id);

  if (stationIds.length === 0) {
    return { records: [], cumulativeGdd: 0, lastDate: sowDateStr };
  }

  const weatherRecords = await prisma.weatherRecord.findMany({
    where: {
      stationId: { in: stationIds },
      timestamp: { gte: sowDateStr },
    },
    orderBy: { timestamp: "asc" },
  });

  if (weatherRecords.length === 0) {
    return { records: [], cumulativeGdd: 0, lastDate: sowDateStr };
  }

  const records: Array<{
    id: string;
    fieldId: string;
    season: number;
    date: string;
    dailyGDD: number;
    cumulativeGDD: number;
    method: string;
  }> = [];
  let cumulative = 0;

  for (const record of weatherRecords) {
    const tmin = record.temperatureMin;
    const tmax = record.temperatureMax;
    if (tmin === null || tmax === null) continue;

    const daily = computeDailyGDD(tmin, tmax, baseTemp, maxTemp);
    cumulative += daily;
    const dateStr = record.timestamp.slice(0, 10);

    const created = await prisma.gDDRecord.create({
      data: {
        fieldId,
        farmId:
          (
            await prisma.cropField.findUnique({
              where: { id: fieldId },
              select: { farmId: true },
            })
          )?.farmId ?? "",
        season,
        date: dateStr,
        dailyGDD: daily,
        cumulativeGDD: cumulative,
        method: "standard",
      },
    });
    records.push(created);
  }

  return {
    records,
    cumulativeGdd: cumulative,
    lastDate:
      records.length > 0 ? records[records.length - 1].date : sowDateStr,
  };
}

export async function runGrowthStageForecast(
  fieldId: string,
  season: number,
  crop: string,
  sowDateStr: string,
  modelId: string,
  cumulativeGdd: number
) {
  const model = await prisma.cropModel.findUnique({ where: { id: modelId } });
  if (!model) return null;

  const thresholds = getStageGddThreshold(model);
  const { nextStage } = determineCurrentStage(cumulativeGdd, thresholds);

  const historicalRecords = await prisma.gDDRecord.findMany({
    where: { fieldId, season },
    orderBy: { date: "desc" },
    take: 14,
  });
  const historicalDailyGdd =
    historicalRecords.length > 0
      ? historicalRecords.reduce((s, r) => s + r.dailyGDD, 0) /
        historicalRecords.length
      : 3.5;

  const fieldData = await prisma.cropField.findUnique({
    where: { id: fieldId },
    select: { farmId: true },
  });
  const farmStationIds = fieldData
    ? (
        await prisma.weatherStation.findMany({
          where: { farmId: fieldData.farmId, isActive: true },
          select: { id: true },
        })
      ).map((s) => s.id)
    : [];

  const weather =
    farmStationIds.length > 0
      ? await prisma.weatherRecord.findMany({
          where: { stationId: { in: farmStationIds } },
          orderBy: { timestamp: "desc" },
          take: 7,
        })
      : [];
  const forecastDailyGdd =
    weather.length > 0
      ? weather.slice(0, 7).reduce((s, r) => s + (r.temperatureMax ?? 15), 0) /
          Math.max(weather.slice(0, 7).length, 1) -
        model.baseTemp
      : 5;

  const forecasts = [];

  for (const stage of STAGE_ORDER) {
    const targetGdd = thresholds[stage];
    if (targetGdd === null) continue;

    await prisma.growthStageForecast.deleteMany({
      where: { fieldId, season, stage },
    });

    const forecastDate = forecastStageDate(
      new Date(),
      cumulativeGdd,
      targetGdd,
      Math.max(0, historicalDailyGdd),
      Math.max(0, forecastDailyGdd)
    );

    const forecast = await prisma.growthStageForecast.create({
      data: {
        fieldId,
        farmId:
          (
            await prisma.cropField.findUnique({
              where: { id: fieldId },
              select: { farmId: true },
            })
          )?.farmId ?? "",
        crop,
        season,
        stage,
        forecastDate: forecastDate.toISOString().slice(0, 10),
        confidence:
          stage === nextStage ||
          (nextStage === null && stage === STAGE_ORDER[STAGE_ORDER.length - 1])
            ? 0.85
            : 0.65,
        gddRequired: targetGdd,
        cumulativeGddAtStage: targetGdd,
      },
    });
    forecasts.push(forecast);
  }

  return forecasts;
}

export function getDefaultCropModel(crop: string) {
  const defaults: Record<
    string,
    {
      base: number;
      optimal: number;
      max: number;
      germination: number;
      emergence: number;
      vegetative: number;
      flowering: number;
      fruiting: number;
      maturity: number;
    }
  > = {
    "Winter Wheat": {
      base: 0,
      optimal: 25,
      max: 35,
      germination: 100,
      emergence: 200,
      vegetative: 600,
      flowering: 900,
      fruiting: 1200,
      maturity: 1600,
    },
    "Spring Wheat": {
      base: 2,
      optimal: 26,
      max: 38,
      germination: 80,
      emergence: 170,
      vegetative: 550,
      flowering: 850,
      fruiting: 1100,
      maturity: 1500,
    },
    "Winter Barley": {
      base: 0,
      optimal: 24,
      max: 35,
      germination: 90,
      emergence: 190,
      vegetative: 580,
      flowering: 880,
      fruiting: 1150,
      maturity: 1550,
    },
    "Spring Barley": {
      base: 2,
      optimal: 25,
      max: 37,
      germination: 70,
      emergence: 160,
      vegetative: 520,
      flowering: 820,
      fruiting: 1080,
      maturity: 1450,
    },
    Maize: {
      base: 10,
      optimal: 28,
      max: 40,
      germination: 80,
      emergence: 150,
      vegetative: 500,
      flowering: 750,
      fruiting: 1000,
      maturity: 1400,
    },
    "Oilseed Rape": {
      base: 3,
      optimal: 22,
      max: 34,
      germination: 100,
      emergence: 200,
      vegetative: 500,
      flowering: 800,
      fruiting: 1000,
      maturity: 1400,
    },
    Potatoes: {
      base: 5,
      optimal: 22,
      max: 32,
      germination: 150,
      emergence: 250,
      vegetative: 550,
      flowering: 750,
      fruiting: 900,
      maturity: 1200,
    },
    Soybeans: {
      base: 10,
      optimal: 27,
      max: 38,
      germination: 80,
      emergence: 150,
      vegetative: 450,
      flowering: 700,
      fruiting: 950,
      maturity: 1300,
    },
    Oats: {
      base: 3,
      optimal: 24,
      max: 35,
      germination: 80,
      emergence: 170,
      vegetative: 500,
      flowering: 750,
      fruiting: 950,
      maturity: 1350,
    },
  };
  return defaults[crop] ?? null;
}
