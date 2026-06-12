import { ApiError, fail, ok, readJson } from "@/app/lib/api";
import { getCurrentUser, hashPassword, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { canManageUsers } from "@/app/lib/rbac";

function serializeProfile(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  farm: {
    id: string;
    name: string;
    location: string | null;
    acreage: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    farm: {
      id: user.farm.id,
      name: user.farm.name,
      location: user.farm.location,
      acreage: user.farm.acreage,
      createdAt: user.farm.createdAt.toISOString(),
      updatedAt: user.farm.updatedAt.toISOString(),
    },
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ApiError(401, "Authentication required");

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { farm: true },
    });

    if (!user || user.farmId !== currentUser.farmId) {
      throw new ApiError(404, "Profile not found");
    }

    return ok(serializeProfile(user));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new ApiError(401, "Authentication required");

    const body = await readJson<Record<string, unknown>>(request);
    const existingUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { farm: true },
    });
    if (!existingUser || existingUser.farmId !== currentUser.farmId) {
      throw new ApiError(404, "Profile not found");
    }

    const userData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {};
    const farmData: {
      name?: string;
      location?: string | null;
      acreage?: number | null;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) throw new ApiError(400, "Name is required");
      if (name !== existingUser.name) {
        userData.name = name;
      }
    }

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email) throw new ApiError(400, "Email is required");
      if (email !== existingUser.email) {
        userData.email = email;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== currentUser.id) {
          throw new ApiError(409, "Email is already in use");
        }
      }
    }

    if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
      if (body.newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters");
      }
      if (typeof body.currentPassword !== "string" || !body.currentPassword) {
        throw new ApiError(400, "Current password is required");
      }

      const validPassword = await verifyPassword(
        body.currentPassword,
        existingUser.passwordHash,
      );
      if (!validPassword) throw new ApiError(401, "Current password is incorrect");

      userData.passwordHash = await hashPassword(body.newPassword);
    }

    const wantsFarmUpdate =
      typeof body.farmName === "string" ||
      typeof body.farmLocation === "string" ||
      typeof body.farmAcreage === "number" ||
      body.farmAcreage === null;

    if (wantsFarmUpdate) {
      if (!canManageUsers(currentUser)) {
        throw new ApiError(
          403,
          "Only admins and farm managers can edit farm details",
        );
      }

      if (typeof body.farmName === "string") {
        const farmName = body.farmName.trim();
        if (!farmName) throw new ApiError(400, "Farm name is required");
        if (farmName !== existingUser.farm.name) {
          farmData.name = farmName;
        }
      }

      if (typeof body.farmLocation === "string") {
        const location = body.farmLocation.trim() || null;
        if (location !== existingUser.farm.location) {
          farmData.location = location;
        }
      }

      if (typeof body.farmAcreage === "number" || body.farmAcreage === null) {
        if (typeof body.farmAcreage === "number" && body.farmAcreage < 0) {
          throw new ApiError(400, "Acreage cannot be negative");
        }
        if (body.farmAcreage !== existingUser.farm.acreage) {
          farmData.acreage = body.farmAcreage;
        }
      }
    }

    if (
      Object.keys(userData).length === 0 &&
      Object.keys(farmData).length === 0
    ) {
      return ok(serializeProfile(existingUser));
    }

    const user = await prisma.$transaction(async (tx) => {
      if (Object.keys(farmData).length > 0) {
        await tx.farm.update({
          where: { id: currentUser.farmId },
          data: farmData,
        });
      }

      return tx.user.update({
        where: { id: currentUser.id },
        data: userData,
        include: { farm: true },
      });
    });

    return ok(serializeProfile(user));
  } catch (error) {
    return fail(error);
  }
}
