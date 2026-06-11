import { ApiError, fail, ok, readJson } from "@/app/lib/api";
import { getCurrentUser, hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { canManageUsers, isRole } from "@/app/lib/rbac";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/users/[id]">,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ApiError(401, "Authentication required");
    if (!canManageUsers(currentUser)) {
      throw new ApiError(403, "Only admins and farm managers can update users");
    }

    const { id } = await context.params;
    const body = await readJson<Record<string, unknown>>(request);
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.email === "string" && body.email.trim()) {
      data.email = body.email.trim().toLowerCase();
    }
    if (isRole(body.role)) {
      data.role = body.role;
    }
    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        throw new ApiError(400, "password must be at least 8 characters");
      }
      data.passwordHash = await hashPassword(body.password);
    }

    const user = await prisma.user.update({
      where: { id, farmId: currentUser.farmId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(user);
  } catch (error) {
    return fail(error);
  }
}
