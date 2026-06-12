import { ok, fail, readJson, requireEntityAccess, ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";
import { computeSeasonGDD, getDefaultCropModel } from "@/app/server/weather/weather-engine";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("gddRecords", "write");
    const body = await readJson<{
      fieldId: string;
      season: number;
    }>(request);

    if (!body.fieldId) throw new ApiError(400, "fieldId is required");
    if (!body.season) throw new ApiError(400, "season is required");

    const field = await prisma.cropField.findFirst({
      where: { id: body.fieldId, farmId: user.farmId },
      include: { farm: true },
    });
    if (!field) throw new ApiError(404, "Field not found");

    const existingModel = await prisma.cropModel.findFirst({
      where: { farmId: user.farmId, crop: field.currentCrop },
    });

    let baseTemp = 0;
    let maxTemp = 35;
    if (existingModel) {
      baseTemp = existingModel.baseTemp;
      maxTemp = existingModel.maxTemp;
    } else {
      const defaults = getDefaultCropModel(field.currentCrop);
      if (defaults) {
        baseTemp = defaults.base;
        maxTemp = defaults.max;
      }
    }

    const result = await computeSeasonGDD(
      body.fieldId,
      body.season,
      baseTemp,
      maxTemp,
      field.sowDate,
    );

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
