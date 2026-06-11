import { fail, ok, readJson, requireEntityAccess } from "@/app/lib/api";
import { createFarmEntity, listFarmEntity } from "@/app/lib/farm-repository";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/farm/[entity]">,
) {
  try {
    const { entity } = await context.params;
    const user = await requireEntityAccess(entity, "read");
    const records = await listFarmEntity(entity, user);
    return ok(records);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/farm/[entity]">,
) {
  try {
    const { entity } = await context.params;
    const user = await requireEntityAccess(entity, "write");
    const body = await readJson<Record<string, unknown>>(request);
    const record = await createFarmEntity(entity, body, user);
    return ok(record, 201);
  } catch (error) {
    return fail(error);
  }
}
