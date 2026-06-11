import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { canAccess } from "./rbac";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireEntityAccess(
  entity: string,
  action: "read" | "write",
) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required");
  if (!canAccess(user, entity, action)) {
    throw new ApiError(403, "You do not have permission for this action");
  }
  return user;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${field} is required`);
  }
  return value.trim();
}
