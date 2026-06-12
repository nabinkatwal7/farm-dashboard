import {
  ApiError,
  fail,
  ok,
  readJson,
  requireEntityAccess,
} from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";
import { calculateWaterBudget } from "@/app/server/soil/soil-hydrology";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("irrigationEvents", "read");
    const body = await readJson<{
      fieldId: string;
      season?: number;
    }>(request);

    if (!body.fieldId) throw new ApiError(400, "fieldId is required");

    const field = await prisma.cropField.findFirst({
      where: { id: body.fieldId, farmId: user.farmId },
    });
    if (!field) throw new ApiError(404, "Field not found");

    const season = body.season ?? new Date().getFullYear();
    const result = await calculateWaterBudget(body.fieldId, season);

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
