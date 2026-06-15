import "server-only";

import { ApiError } from "@/app/lib/api";

export type RotationInput = {
  year: number;
  crop: string;
};

export type SaleItemInput = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

export function cleanBody(body: Record<string, unknown>) {
  const {
    id,
    farmId,
    createdAt,
    updatedAt,
    farm,
    field,
    animal,
    stockItem,
    sale,
    product,
    station,
    zone,
    seedLot,
    flight,
    map,
    operatorUser,
    assigneeUser,
    session,
    ...data
  } = body;
  void id;
  void farmId;
  void createdAt;
  void updatedAt;
  void farm;
  void field;
  void animal;
  void stockItem;
  void sale;
  void product;
  void station;
  void zone;
  void seedLot;
  void flight;
  void map;
  void operatorUser;
  void assigneeUser;
  void session;
  return data;
}

export function toRotationInput(item: unknown): RotationInput {
  if (!item || typeof item !== "object") {
    throw new ApiError(400, "Invalid rotation record");
  }

  const record = item as Record<string, unknown>;
  return {
    year: Number(record.year),
    crop: String(record.crop ?? ""),
  };
}

export function toSaleItemInput(item: unknown): SaleItemInput {
  if (!item || typeof item !== "object") {
    throw new ApiError(400, "Invalid sale item");
  }

  const record = item as Record<string, unknown>;
  const saleItem = {
    productId: String(record.productId ?? ""),
    name: String(record.name ?? ""),
    qty: Number(record.qty),
    price: Number(record.price),
  };

  if (!saleItem.productId || !saleItem.name || !Number.isFinite(saleItem.qty)) {
    throw new ApiError(400, "Invalid sale item");
  }

  return saleItem;
}
