import { ok, fail, readJson, requireEntityAccess, ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("weatherStations", "write");
    const body = await readJson<{
      stationId: string;
      records: Array<{
        timestamp: string;
        temperatureMin?: number;
        temperatureMax?: number;
        temperature?: number;
        humidity?: number;
        windSpeed?: number;
        windDirection?: number;
        precipitation?: number;
        solarRadiation?: number;
        soilTemp?: number;
        soilMoisture?: number;
      }>;
    }>(request);

    if (!body.stationId) throw new ApiError(400, "stationId is required");
    if (!Array.isArray(body.records) || body.records.length === 0) {
      throw new ApiError(400, "At least one weather record is required");
    }

    const station = await prisma.weatherStation.findFirst({
      where: { id: body.stationId, farmId: user.farmId },
    });
    if (!station) throw new ApiError(404, "Weather station not found");

    const created = await prisma.$transaction(
      body.records.map((record) =>
        prisma.weatherRecord.create({
          data: {
            stationId: body.stationId,
            timestamp: record.timestamp,
            temperatureMin: record.temperatureMin,
            temperatureMax: record.temperatureMax,
            temperature: record.temperature,
            humidity: record.humidity,
            windSpeed: record.windSpeed,
            windDirection: record.windDirection,
            precipitation: record.precipitation,
            solarRadiation: record.solarRadiation,
            soilTemp: record.soilTemp,
            soilMoisture: record.soilMoisture,
          },
        }),
      ),
    );

    await prisma.weatherStation.update({
      where: { id: body.stationId },
      data: { lastSyncAt: new Date().toISOString(), lastSyncStatus: "ok" },
    });

    return ok({ ingested: created.length }, 201);
  } catch (error) {
    return fail(error);
  }
}
