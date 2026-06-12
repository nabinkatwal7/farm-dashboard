export type FieldBoundaryPoint = {
  lat: number;
  lng: number;
};

export type CropField = {
  id: string;
  name: string;
  acres: number;
  currentCrop: string;
  status: "planted" | "growing" | "harvested" | "fallow";
  sowDate: string;
  harvestDate?: string;
  lat: number;
  lng: number;
  boundary?: FieldBoundaryPoint[];
  rotation: Array<{ id?: string; year: number; crop: string }>;
};

export type InputLog = {
  id: string;
  date: string;
  fieldId: string;
  fieldName: string;
  type: "seed" | "fertiliser" | "spray" | "other";
  product: string;
  quantity: string;
  unit: string;
  operator: string;
  notes?: string;
};

export type YieldRecord = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  year: number;
  projected: number;
  actual: number;
  unit: string;
};

export type Animal = {
  id: string;
  earTag: string;
  species: "cattle" | "sheep" | "pig" | "poultry" | "other";
  breed: string;
  sex: "M" | "F";
  dob: string;
  group?: string;
  status: "healthy" | "sick" | "quarantine" | "deceased" | "sold";
  notes?: string;
};

export type MedicalRecord = {
  id: string;
  animalId: string;
  earTag: string;
  date: string;
  type: "vaccination" | "treatment" | "illness" | "checkup";
  product?: string;
  condition?: string;
  vetName?: string;
  withdrawalDays?: number;
  withdrawalEnd?: string;
  notes?: string;
};

export type BreedingRecord = {
  id: string;
  damEarTag: string;
  sireEarTag?: string;
  breedingDate: string;
  expectedBirth: string;
  actualBirth?: string;
  offspring?: number;
  status: "pregnant" | "birthed" | "lost";
  notes?: string;
};

export type StockItem = {
  id: string;
  name: string;
  category: "raw" | "processed" | "packaging" | "supplies";
  subCategory: string;
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  batchId?: string;
  fieldOrigin?: string;
  animalOrigin?: string;
  updatedAt: string;
};

export type BatchRecord = {
  id: string;
  batchCode: string;
  product: string;
  origin: string;
  originType: "field" | "animal";
  processedDate: string;
  quantity: number;
  unit: string;
  status: "active" | "sold" | "recalled";
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  batchId?: string;
};

export type SaleRecord = {
  id: string;
  date: string;
  channel: "shop" | "online";
  items: Array<{ productId: string; name: string; qty: number; price: number }>;
  total: number;
  paymentMethod: string;
};

export type Machine = {
  id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  year: number;
  engineHours: number;
  lastService: string;
  nextService: number;
  status: "operational" | "maintenance" | "breakdown";
};

export type WeightRecord = {
  id: string;
  animalId: string;
  earTag: string;
  date: string;
  weightKg: number;
  notes?: string;
};

export type SeedingZone = {
  id?: string;
  name: string;
  rate: number;
  areaAcres: number;
  lat: number;
  lng: number;
  color: string;
};

export type PrescriptionMap = {
  id: string;
  name: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  season: string;
  targetRate?: number;
  status: "draft" | "active" | "applied" | "archived";
  notes?: string;
  zones: SeedingZone[];
  exportedAt?: string;
  exportFormat?: string;
};

export type SeedIntegration = {
  id: string;
  provider: "johndeere" | "fendt";
  label: string;
  apiEndpoint?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  machineId?: string;
  machineName?: string;
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
};

export type WeatherStation = {
  id: string;
  name: string;
  provider: string;
  apiEndpoint?: string;
  apiKey?: string;
  lat?: number;
  lng?: number;
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
};

export type WeatherRecord = {
  id: string;
  stationId: string;
  timestamp: string;
  temperatureMin?: number;
  temperatureMax?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  precipitation?: number;
  solarRadiation?: number;
  soilTemp?: number;
  soilMoisture?: number;
};

export type CropModel = {
  id: string;
  crop: string;
  baseTemp: number;
  optimalTemp: number;
  maxTemp: number;
  gddToGermination?: number;
  gddToEmergence?: number;
  gddToVegetative?: number;
  gddToFlowering?: number;
  gddToFruiting?: number;
  gddToMaturity?: number;
};

export type GDDRecord = {
  id: string;
  fieldId: string;
  season: number;
  date: string;
  dailyGDD: number;
  cumulativeGDD: number;
  method: "standard";
};

export type GrowthStageForecast = {
  id: string;
  fieldId: string;
  crop: string;
  season: number;
  stage: string;
  forecastDate: string;
  confidence: number;
  gddRequired: number;
  cumulativeGddAtStage: number;
  actualDate?: string;
  actualGdd?: number;
};

export type ExpenseRecord = {
  id: string;
  date: string;
  category:
    | "labour"
    | "fuel"
    | "chemicals"
    | "seeds"
    | "repairs"
    | "vet"
    | "rent"
    | "machinery"
    | "utilities"
    | "other";
  description: string;
  amount: number;
  supplier?: string;
  fieldName?: string;
  invoiceRef?: string;
  notes?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  fieldName?: string;
  lat?: number;
  lng?: number;
  assignee: string;
  dueDate: string;
  status: "pending" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
};

export type StockAdjustment = {
  id: string;
  stockItemId: string;
  stockItemName: string;
  date: string;
  delta: number;
  reason: string;
  operator: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getData<T>(entity: string): Promise<T[]> {
  return request<T[]>(`/api/farm/${entity}`);
}

export function saveData<T extends { id?: string }>(
  entity: string,
  item: T,
): Promise<T> {
  const method = item.id ? "PATCH" : "POST";
  const url = item.id ? `/api/farm/${entity}/${item.id}` : `/api/farm/${entity}`;

  return request<T>(url, {
    method,
    body: JSON.stringify(item),
  });
}

export async function deleteData(entity: string, id: string): Promise<void> {
  await request<{ ok: true }>(`/api/farm/${entity}/${id}`, {
    method: "DELETE",
  });
}

export function generateId(): string {
  return "";
}
