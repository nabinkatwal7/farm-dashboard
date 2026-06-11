import { fail, ok, readJson, requireEntityAccess } from "@/app/lib/api";
import {
  deleteFarmEntity,
  updateFarmEntity,
} from "@/app/server/farm/repository";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/farm/[entity]/[id]">
) {
  try {
    const { entity, id } = await context.params;
    const user = await requireEntityAccess(entity, "write");
    const body = await readJson<Record<string, unknown>>(request);
    const record = await updateFarmEntity(entity, id, body, user);
    return ok(record);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/farm/[entity]/[id]">
) {
  try {
    const { entity, id } = await context.params;
    const user = await requireEntityAccess(entity, "write");
    const result = await deleteFarmEntity(entity, id, user);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
