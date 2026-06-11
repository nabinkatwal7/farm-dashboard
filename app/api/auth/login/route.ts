import { ApiError, fail, ok, readJson, requireString } from "@/app/lib/api";
import { createSession, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const email = requireString(body.email, "email").toLowerCase();
    const password = requireString(body.password, "password");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { farm: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid email or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        farmId: user.farmId,
        farm: user.farm,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
