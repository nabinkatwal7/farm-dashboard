import { fail, ok } from "@/app/lib/api";
import { clearSession } from "@/app/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
