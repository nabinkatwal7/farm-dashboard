import { ok } from "@/app/lib/api";
import { getCurrentUser, getSetupState } from "@/app/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const setup = await getSetupState();
  return ok({
    user,
    authenticated: Boolean(user),
    ...setup,
  });
}
