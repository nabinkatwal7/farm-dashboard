import { ok, fail, requireEntityAccess } from "@/app/lib/api";
import { getObservationSummary, getFlightSummary } from "@/app/server/drone/drone-scouting";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("scoutingObservations", "read");
    const body = await request.json().catch(() => ({})) as { season?: number };
    const [flights, observations] = await Promise.all([
      getFlightSummary(user.farmId, body.season),
      getObservationSummary(user.farmId),
    ]);
    return ok({ flights, observations });
  } catch (error) {
    return fail(error);
  }
}
