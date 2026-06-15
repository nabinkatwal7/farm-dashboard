import "server-only";
import { prisma } from "@/app/lib/prisma";

export type PublicBatchData = {
  found: boolean;
  batch: {
    batchCode: string;
    product: string;
    origin: string;
    originType: string;
    processedDate: string;
    quantity: number;
    unit: string;
    status: string;
  } | null;
  productInfo: {
    name: string;
    category: string;
  } | null;
  field: {
    name: string;
    acres: number;
    lat: number;
    lng: number;
    boundary: { lat: number; lng: number }[];
    currentCrop: string;
  } | null;
  yields: Array<{ year: number; crop: string; actual: number; unit: string }>;
  rotations: Array<{ year: number; crop: string }>;
  animals: Array<{ earTag: string; species: string; breed: string; sex: string; dob: string }>;
  saleDate: string | null;
};

export async function getBatchTraceability(batchCode: string): Promise<PublicBatchData> {
  const batch = await prisma.batchRecord.findFirst({
    where: { batchCode },
  });

  if (!batch) {
    return {
      found: false,
      batch: null,
      productInfo: null,
      field: null,
      yields: [],
      rotations: [],
      animals: [],
      saleDate: null,
    };
  }

  let productInfo = null;
  if (batch.batchCode) {
    const products = await prisma.product.findMany({
      where: { batchId: batch.batchCode },
      take: 1,
    });
    if (products.length > 0) {
      productInfo = { name: products[0].name, category: products[0].category };
    }
  }

  let field = null;
  let yields: Array<{ year: number; crop: string; actual: number; unit: string }> = [];
  let rotations: Array<{ year: number; crop: string }> = [];

  if (batch.originType === "field") {
    const cropField = await prisma.cropField.findFirst({
      where: { farmId: batch.farmId, name: { contains: batch.origin } },
    });

    if (cropField) {
      const boundary = JSON.parse(cropField.boundary) as { lat: number; lng: number }[];
      field = {
        name: cropField.name,
        acres: cropField.acres,
        lat: cropField.lat,
        lng: cropField.lng,
        boundary,
        currentCrop: cropField.currentCrop,
      };

      yields = (await prisma.yieldRecord.findMany({
        where: { fieldId: cropField.id },
        orderBy: { year: "desc" },
      })).map((y) => ({ year: y.year, crop: y.crop, actual: y.actual, unit: y.unit }));

      rotations = (await prisma.fieldRotation.findMany({
        where: { fieldId: cropField.id },
        orderBy: { year: "desc" },
      })).map((r) => ({ year: r.year, crop: r.crop }));
    }
  }

  let animals: Array<{ earTag: string; species: string; breed: string; sex: string; dob: string }> = [];
  if (batch.originType === "animal") {
    animals = (await prisma.animal.findMany({
      where: { farmId: batch.farmId },
      take: 50,
    })).map((a) => ({ earTag: a.earTag, species: a.species, breed: a.breed, sex: a.sex, dob: a.dob }));
  }

  let saleDate = null;
  if (productInfo) {
    const saleItem = await prisma.saleItem.findFirst({
      where: { name: productInfo.name },
      include: { sale: true },
      orderBy: { sale: { date: "desc" } },
    });
    if (saleItem) {
      saleDate = saleItem.sale.date;
    }
  }

  return {
    found: true,
    batch: {
      batchCode: batch.batchCode,
      product: batch.product,
      origin: batch.origin,
      originType: batch.originType,
      processedDate: batch.processedDate,
      quantity: batch.quantity,
      unit: batch.unit,
      status: batch.status,
    },
    productInfo,
    field,
    yields,
    rotations,
    animals,
    saleDate,
  };
}
