"use client";

import { apiRequest } from "./http-client";

export const ROLES = [
  "ADMIN",
  "FARM_MANAGER",
  "FIELD_WORKER",
  "LIVESTOCK_MANAGER",
  "INVENTORY_MANAGER",
  "SHOP_STAFF",
  "ACCOUNTANT",
  "VETERINARY",
  "VIEWER",
] as const;

export type UserRole = (typeof ROLES)[number];

export type FarmUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export function listUsers() {
  return apiRequest<FarmUser[]>("/api/users");
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  return apiRequest<FarmUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(
  id: string,
  data: Partial<Pick<FarmUser, "name" | "email" | "role" | "isActive">>,
) {
  return apiRequest<FarmUser>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
