import "server-only";

import { prisma } from "@/app/lib/prisma";

export type FlightSummary = {
  totalFlights: number;
  totalAcres: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  latestFlight: string | null;
};

export type ObservationStat = {
  type: string;
  count: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  avgSeverity: number;
};

export async function getFlightSummary(
  farmId: string,
  season?: number,
): Promise<FlightSummary> {
  const where: Record<string, unknown> = { farmId };
  if (season) {
    const start = `${season}-01-01`;
    const end = `${season}-12-31`;
    where.flightDate = { gte: start, lte: end };
  }

  const flights = await prisma.droneFlight.findMany({ where });

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalAcres = 0;

  for (const f of flights) {
    byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
    const type = f.droneType ?? "unknown";
    byType[type] = (byType[type] ?? 0) + 1;
    totalAcres += f.coverageAcres ?? 0;
  }

  const dates = flights
    .map((f) => f.flightDate)
    .filter(Boolean)
    .sort();

  return {
    totalFlights: flights.length,
    totalAcres: Math.round(totalAcres * 10) / 10,
    byStatus,
    byType,
    latestFlight: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

export async function getObservationsByField(
  farmId: string,
): Promise<Array<{ fieldId: string; fieldName: string; stats: ObservationStat[] }>> {
  const fields = await prisma.cropField.findMany({
    where: { farmId },
    select: { id: true, name: true },
  });

  const result = [];

  for (const field of fields) {
    const observations = await prisma.scoutingObservation.findMany({
      where: { fieldId: field.id },
    });

    if (observations.length === 0) continue;

    const typeMap = new Map<string, { count: number; low: number; medium: number; high: number }>();

    for (const obs of observations) {
      const entry = typeMap.get(obs.observationType) ?? { count: 0, low: 0, medium: 0, high: 0 };
      entry.count++;
      if (obs.severity === "low") entry.low++;
      else if (obs.severity === "medium") entry.medium++;
      else if (obs.severity === "high") entry.high++;
      typeMap.set(obs.observationType, entry);
    }

    const stats: ObservationStat[] = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      lowCount: data.low,
      mediumCount: data.medium,
      highCount: data.high,
      avgSeverity:
        data.count > 0
          ? (data.low * 1 + data.medium * 2 + data.high * 3) / data.count
          : 0,
    }));

    result.push({ fieldId: field.id, fieldName: field.name, stats });
  }

  return result;
}

export async function getObservationSummary(
  farmId: string,
): Promise<ObservationStat[]> {
  const observations = await prisma.scoutingObservation.findMany({
    where: { farmId },
  });

  const typeMap = new Map<string, { count: number; low: number; medium: number; high: number }>();

  for (const obs of observations) {
    const entry = typeMap.get(obs.observationType) ?? { count: 0, low: 0, medium: 0, high: 0 };
    entry.count++;
    if (obs.severity === "low") entry.low++;
    else if (obs.severity === "medium") entry.medium++;
    else if (obs.severity === "high") entry.high++;
    typeMap.set(obs.observationType, entry);
  }

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    lowCount: data.low,
    mediumCount: data.medium,
    highCount: data.high,
    avgSeverity:
      data.count > 0
        ? Math.round(((data.low * 1 + data.medium * 2 + data.high * 3) / data.count) * 10) / 10
        : 0,
  }));
}
