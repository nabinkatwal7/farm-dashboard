// Central localStorage-backed data store for all farm entities

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
  rotation: Array<{ year: number; crop: string }>;
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
  projected: number; // tonnes
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
  origin: string; // field name or ear tag
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
  nextService: number; // hours until next service
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
  delta: number; // positive = added, negative = removed
  reason: string;
  operator: string;
};

// --- Mock seed data ---
const SEED: Record<string, unknown[]> = {
  fields: [
    {
      id: "f1",
      name: "North Meadow",
      acres: 42,
      currentCrop: "Winter Wheat",
      status: "growing",
      sowDate: "2025-10-15",
      lat: 53.95,
      lng: -1.08,
      rotation: [
        { year: 2023, crop: "Oilseed Rape" },
        { year: 2024, crop: "Spring Barley" },
        { year: 2025, crop: "Winter Wheat" },
      ],
    },
    {
      id: "f2",
      name: "South Pasture",
      acres: 68,
      currentCrop: "Grass Ley",
      status: "growing",
      sowDate: "2025-04-01",
      lat: 53.93,
      lng: -1.06,
      rotation: [
        { year: 2023, crop: "Grass Ley" },
        { year: 2024, crop: "Grass Ley" },
        { year: 2025, crop: "Grass Ley" },
      ],
    },
    {
      id: "f3",
      name: "East Arable",
      acres: 55,
      currentCrop: "Spring Oats",
      status: "planted",
      sowDate: "2026-04-10",
      lat: 53.96,
      lng: -1.04,
      rotation: [
        { year: 2023, crop: "Winter Wheat" },
        { year: 2024, crop: "Oilseed Rape" },
        { year: 2025, crop: "Fallow" },
        { year: 2026, crop: "Spring Oats" },
      ],
    },
    {
      id: "f4",
      name: "Home Field",
      acres: 28,
      currentCrop: "Fallow",
      status: "fallow",
      sowDate: "2026-01-01",
      lat: 53.94,
      lng: -1.09,
      rotation: [
        { year: 2023, crop: "Sugar Beet" },
        { year: 2024, crop: "Winter Wheat" },
        { year: 2025, crop: "Spring Barley" },
      ],
    },
    {
      id: "f5",
      name: "River Bottom",
      acres: 35,
      currentCrop: "Oilseed Rape",
      status: "growing",
      sowDate: "2025-09-01",
      lat: 53.92,
      lng: -1.07,
      rotation: [
        { year: 2023, crop: "Winter Wheat" },
        { year: 2024, crop: "Spring Barley" },
        { year: 2025, crop: "Oilseed Rape" },
      ],
    },
  ],
  inputLogs: [
    {
      id: "il1",
      date: "2025-10-15",
      fieldId: "f1",
      fieldName: "North Meadow",
      type: "seed",
      product: "KWS Zyatt Winter Wheat",
      quantity: "180",
      unit: "kg/ha",
      operator: "Tom Greene",
      notes: "Pre-dressed seed",
    },
    {
      id: "il2",
      date: "2025-11-02",
      fieldId: "f1",
      fieldName: "North Meadow",
      type: "fertiliser",
      product: "CAN 27% N",
      quantity: "250",
      unit: "kg/ha",
      operator: "Tom Greene",
    },
    {
      id: "il3",
      date: "2025-10-20",
      fieldId: "f3",
      fieldName: "East Arable",
      type: "spray",
      product: "Roundup ProActive",
      quantity: "4",
      unit: "L/ha",
      operator: "Sarah Mills",
      notes: "Pre-drilling burndown",
    },
    {
      id: "il4",
      date: "2026-04-10",
      fieldId: "f3",
      fieldName: "East Arable",
      type: "seed",
      product: "Mascani Spring Oats",
      quantity: "175",
      unit: "kg/ha",
      operator: "Tom Greene",
    },
    {
      id: "il5",
      date: "2026-03-15",
      fieldId: "f5",
      fieldName: "River Bottom",
      type: "fertiliser",
      product: "AN 34.5%",
      quantity: "200",
      unit: "kg/ha",
      operator: "Sarah Mills",
    },
  ],
  yieldRecords: [
    {
      id: "yr1",
      fieldId: "f1",
      fieldName: "North Meadow",
      crop: "Winter Wheat",
      year: 2025,
      projected: 8.5,
      actual: 9.2,
      unit: "t/ha",
    },
    {
      id: "yr2",
      fieldId: "f2",
      fieldName: "South Pasture",
      crop: "Spring Barley",
      year: 2024,
      projected: 6.0,
      actual: 5.4,
      unit: "t/ha",
    },
    {
      id: "yr3",
      fieldId: "f3",
      fieldName: "East Arable",
      crop: "Oilseed Rape",
      year: 2024,
      projected: 3.8,
      actual: 4.1,
      unit: "t/ha",
    },
    {
      id: "yr4",
      fieldId: "f5",
      fieldName: "River Bottom",
      crop: "Spring Barley",
      year: 2024,
      projected: 7.0,
      actual: 6.8,
      unit: "t/ha",
    },
    {
      id: "yr5",
      fieldId: "f4",
      fieldName: "Home Field",
      crop: "Sugar Beet",
      year: 2023,
      projected: 70,
      actual: 74,
      unit: "t/ha",
    },
  ],
  animals: [
    {
      id: "a1",
      earTag: "UK123456",
      species: "cattle",
      breed: "Hereford",
      sex: "F",
      dob: "2023-03-15",
      group: "Breeding Herd",
      status: "healthy",
    },
    {
      id: "a2",
      earTag: "UK123457",
      species: "cattle",
      breed: "Hereford",
      sex: "M",
      dob: "2022-07-20",
      group: "Bulls",
      status: "healthy",
    },
    {
      id: "a3",
      earTag: "UK123458",
      species: "cattle",
      breed: "Hereford X",
      sex: "F",
      dob: "2024-02-10",
      group: "Young Stock",
      status: "healthy",
    },
    {
      id: "a4",
      earTag: "UK789001",
      species: "sheep",
      breed: "Texel",
      sex: "F",
      dob: "2023-01-20",
      group: "Ewes",
      status: "healthy",
    },
    {
      id: "a5",
      earTag: "UK789002",
      species: "sheep",
      breed: "Texel",
      sex: "F",
      dob: "2023-01-25",
      group: "Ewes",
      status: "sick",
    },
    {
      id: "a6",
      earTag: "UK789050",
      species: "sheep",
      breed: "Suffolk Ram",
      sex: "M",
      dob: "2022-09-05",
      group: "Rams",
      status: "healthy",
    },
    {
      id: "a7",
      earTag: "UK555100",
      species: "pig",
      breed: "Large White",
      sex: "F",
      dob: "2025-01-10",
      group: "Sows",
      status: "healthy",
    },
  ],
  medicalRecords: [
    {
      id: "mr1",
      animalId: "a1",
      earTag: "UK123456",
      date: "2026-03-01",
      type: "vaccination",
      product: "Bovilis Bovipast RSP",
      vetName: "Dr. Alice James",
      withdrawalDays: 0,
    },
    {
      id: "mr2",
      animalId: "a5",
      earTag: "UK789002",
      date: "2026-06-05",
      type: "treatment",
      product: "Oxytetracycline",
      condition: "Pneumonia",
      vetName: "Dr. Bob Smith",
      withdrawalDays: 28,
      withdrawalEnd: "2026-07-03",
    },
    {
      id: "mr3",
      animalId: "a4",
      earTag: "UK789001",
      date: "2026-01-15",
      type: "vaccination",
      product: "Heptavac-P Plus",
      vetName: "Dr. Bob Smith",
      withdrawalDays: 42,
      withdrawalEnd: "2026-02-26",
    },
    {
      id: "mr4",
      animalId: "a7",
      earTag: "UK555100",
      date: "2026-05-20",
      type: "checkup",
      vetName: "Dr. Alice James",
      notes: "Pre-farrowing check — all good",
    },
  ],
  breedingRecords: [
    {
      id: "br1",
      damEarTag: "UK123456",
      sireEarTag: "UK123457",
      breedingDate: "2026-01-20",
      expectedBirth: "2026-10-27",
      status: "pregnant",
    },
    {
      id: "br2",
      damEarTag: "UK789001",
      sireEarTag: "UK789050",
      breedingDate: "2025-11-01",
      expectedBirth: "2026-03-30",
      actualBirth: "2026-04-02",
      offspring: 2,
      status: "birthed",
    },
    {
      id: "br3",
      damEarTag: "UK789002",
      sireEarTag: "UK789050",
      breedingDate: "2025-11-05",
      expectedBirth: "2026-04-03",
      actualBirth: "2026-04-05",
      offspring: 1,
      status: "birthed",
    },
  ],
  stockItems: [
    {
      id: "s1",
      name: "Winter Wheat Grain",
      category: "raw",
      subCategory: "grain",
      quantity: 180,
      unit: "tonnes",
      minStock: 20,
      location: "Grain Store A",
      batchId: "BATCH-2025-WW-01",
      fieldOrigin: "North Meadow",
      updatedAt: "2025-09-01",
    },
    {
      id: "s2",
      name: "Oilseed Rape",
      category: "raw",
      subCategory: "grain",
      quantity: 45,
      unit: "tonnes",
      minStock: 5,
      location: "Grain Store B",
      batchId: "BATCH-2024-OSR-01",
      fieldOrigin: "River Bottom",
      updatedAt: "2024-08-20",
    },
    {
      id: "s3",
      name: "Beef Carcass Quarters",
      category: "raw",
      subCategory: "meat",
      quantity: 8,
      unit: "quarters",
      minStock: 2,
      location: "Cold Store",
      animalOrigin: "UK123459",
      updatedAt: "2026-05-10",
    },
    {
      id: "s4",
      name: "Flour (1kg bags)",
      category: "processed",
      subCategory: "milled",
      quantity: 320,
      unit: "bags",
      minStock: 50,
      location: "Shop Store",
      batchId: "BATCH-2025-FL-01",
      fieldOrigin: "North Meadow",
      updatedAt: "2026-04-15",
    },
    {
      id: "s5",
      name: "Sausages (pork)",
      category: "processed",
      subCategory: "cured",
      quantity: 48,
      unit: "packs",
      minStock: 20,
      location: "Farm Shop Fridge",
      animalOrigin: "UK555100",
      updatedAt: "2026-06-01",
    },
    {
      id: "s6",
      name: "CAN Fertiliser",
      category: "supplies",
      subCategory: "fertiliser",
      quantity: 4200,
      unit: "kg",
      minStock: 1000,
      location: "Chemical Store",
      updatedAt: "2026-03-01",
    },
    {
      id: "s7",
      name: "Rapeseed Oil (500ml)",
      category: "processed",
      subCategory: "bottled",
      quantity: 12,
      unit: "bottles",
      minStock: 20,
      location: "Shop Store",
      batchId: "BATCH-2024-OSR-01",
      fieldOrigin: "River Bottom",
      updatedAt: "2026-05-01",
    },
  ],
  batches: [
    {
      id: "bt1",
      batchCode: "BATCH-2025-WW-01",
      product: "Winter Wheat / Flour",
      origin: "North Meadow",
      originType: "field",
      processedDate: "2025-09-05",
      quantity: 220,
      unit: "tonnes",
      status: "active",
    },
    {
      id: "bt2",
      batchCode: "BATCH-2024-OSR-01",
      product: "Oilseed Rape / Rapeseed Oil",
      origin: "River Bottom",
      originType: "field",
      processedDate: "2024-08-22",
      quantity: 55,
      unit: "tonnes",
      status: "active",
    },
    {
      id: "bt3",
      batchCode: "BATCH-2025-PORK-01",
      product: "Sausages / Bacon",
      origin: "UK555100",
      originType: "animal",
      processedDate: "2026-05-20",
      quantity: 120,
      unit: "kg",
      status: "active",
    },
    {
      id: "bt4",
      batchCode: "BATCH-2024-BEEF-01",
      product: "Beef Joints / Mince",
      origin: "UK123459",
      originType: "animal",
      processedDate: "2026-05-10",
      quantity: 320,
      unit: "kg",
      status: "active",
    },
  ],
  products: [
    {
      id: "p1",
      name: "Wholemeal Flour 1kg",
      category: "Bakery",
      price: 2.5,
      cost: 0.8,
      stock: 320,
      unit: "bag",
    },
    {
      id: "p2",
      name: "Rapeseed Oil 500ml",
      category: "Oils",
      price: 4.99,
      cost: 1.5,
      stock: 12,
      unit: "bottle",
    },
    {
      id: "p3",
      name: "Pork Sausages 400g",
      category: "Meat",
      price: 5.5,
      cost: 2.2,
      stock: 48,
      unit: "pack",
    },
    {
      id: "p4",
      name: "Beef Mince 500g",
      category: "Meat",
      price: 6.0,
      cost: 2.8,
      stock: 36,
      unit: "pack",
    },
    {
      id: "p5",
      name: "Free Range Eggs (12)",
      category: "Dairy & Eggs",
      price: 3.2,
      cost: 1.1,
      stock: 60,
      unit: "box",
    },
    {
      id: "p6",
      name: "Raw Honey 340g",
      category: "Honey",
      price: 7.99,
      cost: 2.5,
      stock: 24,
      unit: "jar",
    },
    {
      id: "p7",
      name: "Straw Bale",
      category: "Farm",
      price: 6.0,
      cost: 1.8,
      stock: 200,
      unit: "bale",
    },
  ],
  sales: [
    {
      id: "sl1",
      date: "2026-06-11",
      channel: "shop",
      items: [
        { productId: "p1", name: "Wholemeal Flour 1kg", qty: 3, price: 2.5 },
        { productId: "p3", name: "Pork Sausages 400g", qty: 2, price: 5.5 },
      ],
      total: 18.5,
      paymentMethod: "card",
    },
    {
      id: "sl2",
      date: "2026-06-10",
      channel: "online",
      items: [
        { productId: "p2", name: "Rapeseed Oil 500ml", qty: 4, price: 4.99 },
        { productId: "p6", name: "Raw Honey 340g", qty: 2, price: 7.99 },
      ],
      total: 35.94,
      paymentMethod: "online",
    },
    {
      id: "sl3",
      date: "2026-06-10",
      channel: "shop",
      items: [
        { productId: "p4", name: "Beef Mince 500g", qty: 2, price: 6.0 },
        { productId: "p5", name: "Free Range Eggs (12)", qty: 1, price: 3.2 },
      ],
      total: 15.2,
      paymentMethod: "cash",
    },
    {
      id: "sl4",
      date: "2026-06-09",
      channel: "shop",
      items: [{ productId: "p7", name: "Straw Bale", qty: 10, price: 6.0 }],
      total: 60.0,
      paymentMethod: "card",
    },
    {
      id: "sl5",
      date: "2026-06-09",
      channel: "online",
      items: [
        { productId: "p1", name: "Wholemeal Flour 1kg", qty: 6, price: 2.5 },
        { productId: "p3", name: "Pork Sausages 400g", qty: 3, price: 5.5 },
      ],
      total: 31.5,
      paymentMethod: "online",
    },
  ],
  machines: [
    {
      id: "m1",
      name: "John Deere 6R 150",
      type: "Tractor",
      make: "John Deere",
      model: "6R 150",
      year: 2021,
      engineHours: 2840,
      lastService: "2026-02-15",
      nextService: 500,
      status: "operational",
    },
    {
      id: "m2",
      name: "Case IH Axial-Flow 250",
      type: "Combine Harvester",
      make: "Case IH",
      model: "Axial-Flow 250",
      year: 2019,
      engineHours: 1240,
      lastService: "2025-07-10",
      nextService: 260,
      status: "operational",
    },
    {
      id: "m3",
      name: "Claas Lexion 8900",
      type: "Combine Harvester",
      make: "Claas",
      model: "Lexion 8900",
      year: 2022,
      engineHours: 890,
      lastService: "2026-01-20",
      nextService: 610,
      status: "operational",
    },
    {
      id: "m4",
      name: "Fendt 516 Vario",
      type: "Tractor",
      make: "Fendt",
      model: "516 Vario",
      year: 2020,
      engineHours: 3100,
      lastService: "2025-11-10",
      nextService: 150,
      status: "maintenance",
    },
    {
      id: "m5",
      name: "Manitou MLT 731",
      type: "Telehandler",
      make: "Manitou",
      model: "MLT 731",
      year: 2023,
      engineHours: 520,
      lastService: "2026-04-01",
      nextService: 980,
      status: "operational",
    },
  ],
  weightRecords: [
    {
      id: "wr1",
      animalId: "a1",
      earTag: "UK123456",
      date: "2026-01-10",
      weightKg: 520,
    },
    {
      id: "wr2",
      animalId: "a1",
      earTag: "UK123456",
      date: "2026-04-05",
      weightKg: 548,
    },
    {
      id: "wr3",
      animalId: "a2",
      earTag: "UK123457",
      date: "2026-01-10",
      weightKg: 680,
    },
    {
      id: "wr4",
      animalId: "a4",
      earTag: "UK789001",
      date: "2026-02-01",
      weightKg: 72,
    },
    {
      id: "wr5",
      animalId: "a4",
      earTag: "UK789001",
      date: "2026-05-01",
      weightKg: 78,
    },
  ],
  expenses: [
    {
      id: "ex1",
      date: "2026-01-05",
      category: "rent",
      description: "Q1 land rent — 320 acres",
      amount: 9600,
      supplier: "Greenwood Estate Trust",
      invoiceRef: "RENT-2026-Q1",
    },
    {
      id: "ex2",
      date: "2026-01-10",
      category: "labour",
      description: "January wages — 3 full-time staff",
      amount: 7200,
      supplier: "Payroll",
    },
    {
      id: "ex3",
      date: "2026-01-15",
      category: "fuel",
      description: "Red diesel — 2,000L",
      amount: 1760,
      supplier: "Yorkshire Fuels Ltd",
      invoiceRef: "YF-20260115",
    },
    {
      id: "ex4",
      date: "2026-01-20",
      category: "vet",
      description: "Heptavac-P Plus vaccination programme — sheep",
      amount: 320,
      supplier: "Dale Vets",
    },
    {
      id: "ex5",
      date: "2026-02-10",
      category: "labour",
      description: "February wages — 3 full-time staff",
      amount: 7200,
      supplier: "Payroll",
    },
    {
      id: "ex6",
      date: "2026-02-20",
      category: "seeds",
      description: "Mascani Spring Oats seed — 2 tonnes",
      amount: 1140,
      supplier: "Hutchinsons Agronomy",
      invoiceRef: "HUTCH-26-0221",
      fieldName: "East Arable",
    },
    {
      id: "ex7",
      date: "2026-02-28",
      category: "utilities",
      description: "Farm electricity — Feb",
      amount: 480,
      supplier: "Eon Energy",
    },
    {
      id: "ex8",
      date: "2026-03-01",
      category: "chemicals",
      description: "AN 34.5% fertiliser — 5 tonnes",
      amount: 1650,
      supplier: "NutriFlow UK",
      invoiceRef: "NF-260301",
    },
    {
      id: "ex9",
      date: "2026-03-10",
      category: "labour",
      description: "March wages — 3 full-time staff",
      amount: 7200,
      supplier: "Payroll",
    },
    {
      id: "ex10",
      date: "2026-03-20",
      category: "repairs",
      description: "Fendt 516 hydraulic seal repair",
      amount: 890,
      supplier: "Minster Machinery",
      invoiceRef: "MM-20260320",
    },
    {
      id: "ex11",
      date: "2026-04-05",
      category: "rent",
      description: "Q2 land rent — 320 acres",
      amount: 9600,
      supplier: "Greenwood Estate Trust",
      invoiceRef: "RENT-2026-Q2",
    },
    {
      id: "ex12",
      date: "2026-04-10",
      category: "labour",
      description: "April wages — 3 full-time + 1 seasonal",
      amount: 8400,
      supplier: "Payroll",
    },
    {
      id: "ex13",
      date: "2026-04-15",
      category: "fuel",
      description: "Red diesel — 1,500L spring drilling",
      amount: 1320,
      supplier: "Yorkshire Fuels Ltd",
    },
    {
      id: "ex14",
      date: "2026-04-22",
      category: "chemicals",
      description: "Karate Zeon insecticide — 10L",
      amount: 245,
      supplier: "Agrovista UK",
      invoiceRef: "AV-260422",
    },
    {
      id: "ex15",
      date: "2026-05-10",
      category: "labour",
      description: "May wages — 3 full-time + 1 seasonal",
      amount: 8400,
      supplier: "Payroll",
    },
    {
      id: "ex16",
      date: "2026-05-15",
      category: "vet",
      description: "Bovilis vaccination programme — cattle",
      amount: 540,
      supplier: "Dale Vets",
    },
    {
      id: "ex17",
      date: "2026-05-25",
      category: "machinery",
      description: "Combine harvester pre-season service — Case IH",
      amount: 1200,
      supplier: "Minster Machinery",
      invoiceRef: "MM-20260525",
    },
    {
      id: "ex18",
      date: "2026-05-31",
      category: "utilities",
      description: "Farm electricity + water — May",
      amount: 510,
      supplier: "Eon Energy",
    },
    {
      id: "ex19",
      date: "2026-06-05",
      category: "labour",
      description: "June wages — 3 full-time + 2 seasonal",
      amount: 9600,
      supplier: "Payroll",
    },
    {
      id: "ex20",
      date: "2026-06-08",
      category: "fuel",
      description: "Red diesel — 1,200L",
      amount: 1056,
      supplier: "Yorkshire Fuels Ltd",
    },
  ],
  stockAdjustments: [],
  tasks: [
    {
      id: "t1",
      title: "Spray North Meadow for aphids",
      description:
        "Apply Karate Zeon @ 100ml/ha. Check LERAP buffer before spraying near watercourse.",
      fieldName: "North Meadow",
      lat: 53.95,
      lng: -1.08,
      assignee: "Sarah Mills",
      dueDate: "2026-06-14",
      status: "pending",
      priority: "high",
    },
    {
      id: "t2",
      title: "Fertilise East Arable",
      description: "Apply 180kg/ha AN 34.5% top dressing to spring oats.",
      fieldName: "East Arable",
      lat: 53.96,
      lng: -1.04,
      assignee: "Tom Greene",
      dueDate: "2026-06-13",
      status: "in-progress",
      priority: "high",
    },
    {
      id: "t3",
      title: "Service Fendt 516 Vario",
      description:
        "Full 500hr service — oil, filters, greasing. Book with dealer.",
      assignee: "Mike Brown",
      dueDate: "2026-06-12",
      status: "pending",
      priority: "high",
    },
    {
      id: "t4",
      title: "Pregnancy scanning — ewes",
      description:
        "Vet booked for 10am. 48 ewes to scan. Record results per ear tag.",
      fieldName: "South Pasture",
      lat: 53.93,
      lng: -1.06,
      assignee: "Tom Greene",
      dueDate: "2026-06-15",
      status: "pending",
      priority: "medium",
    },
    {
      id: "t5",
      title: "Restock shop — flour & oils",
      description:
        "Pack 50 x 1kg flour bags and 20 x rapeseed oil bottles from store.",
      assignee: "Jenny Shaw",
      dueDate: "2026-06-12",
      status: "done",
      priority: "low",
    },
    {
      id: "t6",
      title: "Check River Bottom drainage",
      description:
        "Standing water visible in south corner after rainfall. Inspect and clear drains.",
      fieldName: "River Bottom",
      lat: 53.92,
      lng: -1.07,
      assignee: "Mike Brown",
      dueDate: "2026-06-13",
      status: "in-progress",
      priority: "medium",
    },
  ],
};

function getKey(entity: string) {
  return `farmos_${entity}`;
}

export function getData<T>(entity: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getKey(entity));
  if (!raw) {
    // Seed on first load
    const seed = SEED[entity] ?? [];
    localStorage.setItem(getKey(entity), JSON.stringify(seed));
    return seed as T[];
  }
  return JSON.parse(raw) as T[];
}

export function saveData<T extends { id: string }>(
  entity: string,
  item: T,
): void {
  const all = getData<T>(entity);
  const idx = all.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    all[idx] = item;
  } else {
    all.push(item);
  }
  localStorage.setItem(getKey(entity), JSON.stringify(all));
}

export function deleteData(entity: string, id: string): void {
  const all = getData<{ id: string }>(entity);
  const filtered = all.filter((x) => x.id !== id);
  localStorage.setItem(getKey(entity), JSON.stringify(filtered));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
