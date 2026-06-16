import { ApiError, fail, ok, readJson, requireString } from "@/app/lib/api";
import { createSession, hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const farmName = requireString(body.farmName, "farmName");
    const name = requireString(body.name, "name");
    const email = requireString(body.email, "email").toLowerCase();
    const password = requireString(body.password, "password");
    const lat = optionalNumber(body.lat);
    const lng = optionalNumber(body.lng);
    const acreage = optionalNumber(body.acreage);

    if (password.length < 8) {
      throw new ApiError(400, "password must be at least 8 characters");
    }

    if (lat !== null && (lat < -90 || lat > 90)) {
      throw new ApiError(400, "latitude is invalid");
    }

    if (lng !== null && (lng < -180 || lng > 180)) {
      throw new ApiError(400, "longitude is invalid");
    }

    if (acreage !== null && acreage < 0) {
      throw new ApiError(400, "acreage must be zero or greater");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        farm: {
          create: {
            name: farmName,
            location:
              typeof body.location === "string" && body.location.trim()
                ? body.location.trim()
                : null,
            lat,
            lng,
            acreage,
          },
        },
      },
      include: { farm: true },
    });

    await createSession(user.id);

    return ok(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmId: user.farmId,
          farm: user.farm,
        },
      },
      201,
    );
  } catch (error) {
    return fail(error);
  }
}
