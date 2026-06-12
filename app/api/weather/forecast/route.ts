import { ok, fail, readJson, requireEntityAccess, ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";
import { runGrowthStageForecast, computeSeasonGDD, getDefaultCropModel } from "@/app/server/weather/weather-engine";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("growthStageForecasts", "write");
    const body = await readJson<{
      fieldId: string;
      season: number;
    }>(request);

    if (!body.fieldId) throw new ApiError(400, "fieldId is required");
    if (!body.season) throw new ApiError(400, "season is required");

    const field = await prisma.cropField.findFirst({
      where: { id: body.fieldId, farmId: user.farmId },
    });
    if (!field) throw new ApiError(404, "Field not found");

    let model = await prisma.cropModel.findFirst({
      where: { farmId: user.farmId, crop: field.currentCrop },
    });

    if (!model) {
      const defaults = getDefaultCropModel(field.currentCrop);
      if (defaults) {
        model = await prisma.cropModel.create({
          data: {
            farmId: user.farmId,
            crop: field.currentCrop,
            baseTemp: defaults.base,
            optimalTemp: defaults.optimal,
            maxTemp: defaults.max,
            gddToGermination: defaults.germination,
            gddToEmergence: defaults.emergence,
            gddToVegetative: defaults.vegetative,
            gddToFlowering: defaults.flowering,
            gddToFruiting: defaults.fruiting,
            gddToMaturity: defaults.maturity,
          },
        });
      }
    }

    if (!model) throw new ApiError(400, `No crop model available for ${field.currentCrop}`);

    const gddResult = await computeSeasonGDD(
      body.fieldId,
      body.season,
      model.baseTemp,
      model.maxTemp,
      field.sowDate,
    );

    const forecasts = await runGrowthStageForecast(
      body.fieldId,
      body.season,
      field.currentCrop,
      field.sowDate,
      model.id,
      gddResult.cumulativeGdd,
    );

    return ok({ gdd: gddResult, forecasts });
  } catch (error) {
    return fail(error);
  }
}
