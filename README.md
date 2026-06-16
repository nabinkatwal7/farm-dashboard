# FieldPilot — Farm Management Platform

A comprehensive, data-driven farm management platform built with **Next.js 16**, **Prisma**, and **PostgreSQL**. FieldPilot integrates precision agriculture, livestock traceability, financial tracking, and regulatory compliance into a single unified dashboard.

---

## Focus & Purpose

FieldPilot is designed for **modern commercial farms** that need to:

- **Track field-level crop operations** — inputs, yields, rotations, and prescription maps
- **Monitor weather & crop development** — GDD accumulation, growth stage forecasting, and thermal time modelling
- **Manage soil health & irrigation** — moisture sensing, water table readings, and water-budget analytics
- **Operate precision seeding equipment** — variable-rate prescription maps integrated with industry seed APIs
- **Maintain full livestock provenance** — births, deaths, medical records, weights, breeding, and movements
- **Comply with national livestock regulations** — automated statutory registrations, death notifications, and transfer records via national database integration (BCMS, NLIS, etc.)
- **Capture EID/RFID scanning in real time** — Bluetooth wand scanner pipeline for instant population logging during handling
- **Analyse post-harvest grain storage** — ambient drying speeds, moisture evaporation, and weight loss simulation
- **Manage inventory and product sales** — stock adjustments, batch traceability, and a point-of-sale interface
- **Track farm finances & expenses** — categorised expenditure logging and reporting
- **Assign and manage tasks** — field worker operations with assignee tracking
- **Apply role-based access control** — 9 distinct roles with granular read/write permissions per domain

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 16 App                    │
│  ┌───────────────────────────────────────────────┐  │
│  │              Client Components                │  │
│  │  (React 19, Mantine UI, Recharts, Leaflet)    │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │ fetch() / SWR                     │
│  ┌──────────────▼────────────────────────────────┐  │
│  │          API Routes (REST + JSON)              │  │
│  │  ┌────────────────┐  ┌────────────────────┐   │  │
│  │  │  Generic CRUD   │  │  Custom Endpoints   │   │  │
│  │  │  /api/farm/[e]  │  │  /api/drone, /api/  │   │  │
│  │  │                 │  │  livestock, /api/   │   │  │
│  │  │                 │  │  weather, /api/soil │   │  │
│  │  └────────┬───────┘  └──────────┬─────────┘   │  │
│  └───────────┼─────────────────────┼─────────────┘  │
│              │                     │                 │
│  ┌───────────▼─────────────────────▼─────────────┐  │
│  │             Server Modules                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │Farm Repo │ │Drone     │ │ Livestock    │  │  │
│  │  │+ Payload │ │Scouting  │ │ Traceability │  │  │
│  │  │+ Scope   │ │Engine    │ │ RFID Engine  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │Weather   │ │Soil      │ │ Seed         │  │  │
│  │  │Engine    │ │Hydrology │ │ Viability    │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │       Prisma ORM + PostgreSQL                │  │
│  │         (43 models, auto-generated client)   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Layer Breakdown

| Layer | Technology | Responsibility |
|---|---|---|
| **UI** | React 19 + Mantine 7 + Recharts + Leaflet | Feature pages, stat cards, modals, forms, charts, maps |
| **Client** | Custom `useFarmData` hook + `fetch()` | Data fetching, CRUD helpers (`getData`, `saveData`, `deleteData`) |
| **API** | Next.js App Router (`route.ts`) | REST endpoints — generic CRUD (`/api/farm/[entity]`) + custom business logic endpoints |
| **Server** | Server-only modules | Business logic engines, RBAC, payload sanitisation, scope-based filtering |
| **Persistence** | Prisma 5 + PostgreSQL | 43 models, auto-generated client, schema sync via `npm run db:push` |

---

## Features

### 🌾 Arable & Crop Management
| Feature | Route | Description |
|---|---|---|
| **Crops & Fields** | `/crops` | Field mapping (Leaflet), input logs (fertiliser/spray), yield tracking with charts, crop rotation history, field boundary acreage calculation |
| **Precision Farming** | `/seeding` | Variable-rate seeding prescription maps with zone management, seed integration API connections (John Deere, Fendt), export support |

### 🌤️ Weather & Crop Modelling
| Feature | Route | Description |
|---|---|---|
| **Weather & GDD** | `/weather` | Weather station management, Growing Degree Day computation (standard/modified methods), growth stage forecasting with confidence scoring, bulk data ingest |
| **Crop Models** | *(via `/weather`)* | Configurable base/optimal/max temperatures per crop, phenological stage GDD thresholds (germination → maturity) |

### 💧 Soil & Irrigation
| Feature | Route | Description |
|---|---|---|
| **Soil & Moisture** | `/soil` | Soil zone management, moisture/temperature/EC readings, water table depth tracking, irrigation event logging with water-budget analytics |

### 🌱 Seed & Germination
| Feature | Route | Description |
|---|---|---|
| **Seed Tracker** | `/seed` | Seed lot inventory, germination testing (paper/towel/soil methods), seed-to-field consignment tracking, viability analysis |

### 🛰️ Drone Scouting
| Feature | Route | Description |
|---|---|---|
| **Drone Scouting** | `/drone` | Drone flight logging, orthomosaic map indexing (NDVI/true colour/thermal/multi-spectral), scouting observations with severity tagging, geospatial tagging (lat/lng), per-observation image URLs |

### 📦 Post-Harvest Storage
| Feature | Route | Description |
|---|---|---|
| **Crop Drydown** | `/drydown` | Grain batch tracking in storage sheds, moisture drying simulation, weight loss calculation from evaporation, target moisture modelling, ambient temperature/humidity tracking |

### 🐄 Livestock Management
| Feature | Route | Description |
|---|---|---|
| **Livestock** | `/livestock` | Animal registry (ear tags, species, breeds, DOB), medical/vaccination records, weight tracking, breeding management with expected birth dates |

### 📋 National Traceability
| Feature | Route | Description |
|---|---|---|
| **Traceability** | `/livestock-traceability` | Integration engine connecting to national livestock databases (BCMS UK, NLIS Australia, generic Agri Registry). Automated statutory registrations, birth notifications, death notifications, transfer records. Full sync audit trail with per-animal sync status |

### 📡 EID/RFID Hardware Sync
| Feature | Route | Description |
|---|---|---|
| **RFID Scanner** | `/rfid-scanner` | Real-time Bluetooth wand scanner pipeline. Create handling sessions, capture EID tag reads via simulated wand input or bulk import. Auto-matches tags to existing animals. Session management with matched/unmatched reporting |

### 🏪 Commerce & Finance
| Feature | Route | Description |
|---|---|---|
| **Inventory** | `/inventory` | Stock item management with categories, low-stock alerts, batch traceability, stock adjustments with operator tracking |
| **Shop & POS** | `/shop` | Product catalogue, point-of-sale transactions with line-item sales, payment method tracking |
| **Finance** | `/finance` | Categorised expense tracking (labour, fuel, chemicals, seeds, repairs, vet, rent, machinery, utilities) |

### 🔧 Operations & Administration
| Feature | Route | Description |
|---|---|---|
| **Operations** | `/operations` | Farm machinery/equipment register (type, make, model, engine hours, service intervals) |
| **Dashboard** | `/` | Overview of key farm metrics |
| **Users** | `/users` | User management with 9 role types (ADMIN → VIEWER), role-based access control per entity |

---

## Database Models (43 total)

### Core
`Farm`, `User`, `Session`

### Crop & Field
`CropField`, `FieldRotation`, `InputLog`, `YieldRecord`, `PrescriptionMap`, `SeedingZone`

### Weather & Growth
`WeatherStation`, `WeatherRecord`, `CropModel`, `GDDRecord`, `GrowthStageForecast`

### Soil & Water
`SoilZone`, `SoilMoistureRecord`, `WaterTableReading`, `IrrigationEvent`

### Seed
`SeedLot`, `GerminationTest`, `Consignment`, `SeedIntegration`

### Drone & Scouting
`DroneFlight`, `OrthomosaicMap`, `ScoutingObservation`

### Post-Harvest
`DrydownBatch`

### Livestock
`Animal`, `MedicalRecord`, `BreedingRecord`, `WeightRecord`

### Livestock Traceability
`LivestockIntegration`, `LivestockSyncRecord`

### EID/RFID
`RFIDScanSession`, `RFIDTagRead`

### Commerce
`Product`, `SaleRecord`, `SaleItem`, `StockItem`, `StockAdjustment`, `BatchRecord`

### Operations
`Machine`, `Task`

### Finance
`ExpenseRecord`

---

## API Routes

### Generic CRUD (`/api/farm/[entity]` + `/[id]`)
All 34 registered entities support `GET` (list), `POST` (create), `PATCH` (update by ID), `DELETE` (delete by ID) — with automatic farm-scoping, RBAC enforcement, and relation sanitisation.

### Custom Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/drone/summary` | Aggregated drone flight and observation summaries |
| `POST` | `/api/livestock/rfid/scan` | Process EID tag reads (single, bulk) and complete scan sessions |
| `POST` | `/api/livestock/traceability/sync` | Trigger national database sync (all, registrations, births, deaths) |
| `POST` | `/api/seed/viability` | Seed germination viability analysis |
| `POST` | `/api/soil/water-budget` | Soil water-budget calculations |
| `POST` | `/api/weather/compute-gdd` | GDD computation per field/season |
| `POST` | `/api/weather/forecast` | Growth stage forecasting |
| `POST` | `/api/weather/ingest` | Bulk weather data import |

### Auth & Users
| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | Session invalidation |
| `GET` | `/api/auth/me` | Current user + farm context |
| `POST` | `/api/auth/setup` | Initial admin account creation |
| `GET/PATCH` | `/api/profile` | User profile |
| `GET/POST` | `/api/users` | User administration |
| `PATCH/DELETE` | `/api/users/[id]` | Individual user management |

---

## RBAC (Role-Based Access Control)

| Role | Scope |
|---|---|
| **ADMIN** | Full access to everything |
| **FARM_MANAGER** | All write operations except veterinary |
| **FIELD_WORKER** | Crop, drone, soil, drydown, task operations |
| **LIVESTOCK_MANAGER** | Animal, breeding, traceability, RFID operations |
| **INVENTORY_MANAGER** | Stock, product, batch operations |
| **SHOP_STAFF** | Product sales and stock reads |
| **ACCOUNTANT** | Finance, yield, sales reads |
| **VETERINARY** | Medical, weight, breeding records |
| **VIEWER** | Read-only across permitted domains |

Each entity in `app/lib/rbac.ts` defines its own `read` and `write` role lists.

---

## Use Cases

### For Farm Managers & Owners
- Monitor all field operations from a single dashboard — inputs applied, yields achieved, current crop status
- Track GDD accumulation and forecast growth stages to plan spraying, irrigation, and harvest timing
- View soil moisture trends and water table depth to optimise irrigation scheduling
- Analyse post-harvest grain drydown rates to decide when grain is ready for sale
- Audit livestock provenance end-to-end: birth → movements → medical → sale or death

### For Livestock Managers
- Register animals with full pedigree details (ear tag, breed, DOB, parentage)
- Record routine medical treatments, vaccinations, and withdrawal periods
- Log breeding events and monitor expected birth dates
- **Connect to national databases** (BCMS, NLIS) for automated statutory registrations
- Use **Bluetooth EID/RFID wands** during handling to capture population data in real time

### For Field Workers
- Log fertiliser, chemical, and seed applications with operator attribution
- Record scouting observations from drone orthomosaic maps
- Tag weed pressure, nitrogen deficiency, pest, and disease findings with GPS coordinates
- View assigned tasks and update completion status

### For Inventory & Shop Staff
- Track stock levels across categories with low-stock alerts
- Manage product batches for full traceability from origin to sale
- Process point-of-sale transactions with line-item tracking

### For Accountants
- Log and categorise farm expenses (labour, fuel, chemicals, repairs, etc.)
- View yield records and projected vs actual production
- Access sales data for financial reporting

### For Regulatory Compliance
- **Livestock Traceability**: Meet statutory requirements for animal registration, movement recording, and death notification (UK BCMS, Australian NLIS, etc.)
- **Batch Traceability**: Track products from raw material through processing to sale
- **Medical Withdrawal**: Monitor withdrawal periods for treated animals to ensure food safety

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.2.9 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **UI Library** | React 19.2.4, Mantine 7, Lucide icons |
| **Charts** | Recharts |
| **Maps** | Leaflet (react-leaflet) |
| **ORM** | Prisma 5.20 (auto-generated client) |
| **Database** | PostgreSQL (`POSTGRES_PRISMA_URL`, direct URL via `POSTGRES_URL_NON_POOLING`) |
| **Auth** | Custom session-based (SHA-256 password hashing) |
| **Notifications** | Mantine Notifications |
| **CSS** | Custom CSS variables + inline styles |

---

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client and sync PostgreSQL schema
npm run db:push

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The app is available at `http://localhost:3000`.

### First Run

1. Navigate to `/login` — if no admin user exists, you will be redirected to `/login?setup=1`
2. Create the initial admin account
3. Create a farm via the UI
4. Start adding fields, animals, and data

---

## Project Structure

```
app/
├── abstract/ui/          # Reusable UI components (Modal, FormField, StatCard)
├── api/                  # API routes (REST endpoints)
│   ├── auth/             # Authentication endpoints
│   ├── drone/            # Drone scouting API
│   ├── farm/             # Generic CRUD API ([entity], [entity]/[id])
│   ├── livestock/        # RFID scan + traceability sync
│   ├── seed/             # Seed viability
│   ├── soil/             # Water budget
│   ├── weather/          # GDD, forecast, ingest
│   └── profile/          # User profile
├── base/
│   ├── hooks/            # useFarmData, useCurrentUser
│   └── services/         # farm-client.ts (types + CRUD helpers)
├── components/           # Shared UI (Sidebar, FieldMap)
├── features/             # Page components (one per route)
├── lib/                  # Server utilities (auth, RBAC, Prisma client, API helpers)
├── server/               # Business logic engines
│   ├── drone/
│   ├── farm/             # Repository, payload, scope, entity config
│   ├── livestock/        # Traceability engine, RFID engine
│   ├── seed/
│   ├── soil/
│   └── weather/
└── [route]/              # Route pages (thin wrappers)
prisma/
└── schema.prisma         # Database schema (43 models)
```
