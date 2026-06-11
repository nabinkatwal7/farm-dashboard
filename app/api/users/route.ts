import { ApiError, fail, ok, readJson, requireString } from "@/app/lib/api";
import { getCurrentUser, hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { canManageUsers, isRole } from "@/app/lib/rbac";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ApiError(401, "Authentication required");
    if (!canManageUsers(currentUser)) {
      throw new ApiError(403, "Only admins and farm managers can manage users");
    }

    const users = await prisma.user.findMany({
      where: { farmId: currentUser.farmId },
      orderBy: { name: "asc" },
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

    return ok(users);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ApiError(401, "Authentication required");
    if (!canManageUsers(currentUser)) {
      throw new ApiError(403, "Only admins and farm managers can create users");
    }

    const body = await readJson<Record<string, unknown>>(request);
    const name = requireString(body.name, "name");
    const email = requireString(body.email, "email").toLowerCase();
    const password = requireString(body.password, "password");

    if (!isRole(body.role)) throw new ApiError(400, "Invalid role");
    if (password.length < 8) {
      throw new ApiError(400, "password must be at least 8 characters");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: body.role,
        farmId: currentUser.farmId,
      },
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

    return ok(user, 201);
  } catch (error) {
    return fail(error);
  }
}
