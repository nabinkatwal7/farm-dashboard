import { getCurrentUser, getSetupState } from "@/app/lib/auth";
import { ok } from "@/app/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  const setup = await getSetupState();
  return ok({
    user,
    authenticated: Boolean(user),
    ...setup,
  });
}
