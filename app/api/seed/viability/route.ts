import { ok, fail, readJson, requireEntityAccess, ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";
import {
  getViabilityCurve,
  computeGerminationDecline,
} from "@/app/server/seed/seed-tracker";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("germinationTests", "read");
    const body = await readJson<{ seedLotId: string }>(request);

    if (!body.seedLotId) throw new ApiError(400, "seedLotId is required");

    const lot = await prisma.seedLot.findFirst({
      where: { id: body.seedLotId, farmId: user.farmId },
    });
    if (!lot) throw new ApiError(404, "Seed lot not found");

    const [viability, decline] = await Promise.all([
      getViabilityCurve(body.seedLotId),
      computeGerminationDecline(body.seedLotId),
    ]);

    return ok({ viability, decline });
  } catch (error) {
    return fail(error);
  }
}
