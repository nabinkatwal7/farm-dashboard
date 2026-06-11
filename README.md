# FarmOS Dashboard

FarmOS is a modular Next.js farm management dashboard with a Prisma + SQLite backend. It covers crop records, livestock records, inventory, batch traceability, POS sales, operations, finance, authentication, and role-based user management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js `16.2.9` (App Router) |
| UI | React `19`, Tailwind CSS v4, Lucide icons |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| ORM | Prisma `5.x` |
| Database | SQLite (local `prisma/dev.db`) |
| Auth | bcryptjs (password hashing) + HTTP-only session cookies |
| Language | TypeScript `5.x` |
| Linting | ESLint (Next.js core-web-vitals) |

## Architecture

The project follows a four-layer modular architecture:

| Layer | Path | Responsibility |
|-------|------|---------------|
| **App** | `app/**/page.tsx`, `app/api/**`, `app/layout.tsx` | Next.js routing, layout, thin route wrappers |
| **Feature** | `app/features/*` | Screen-level UI, state, forms per domain |
| **Base** | `app/base/` | Shared client services, hooks, API wrappers |
| **Abstract** | `app/abstract/` | Reusable dumb UI primitives |
| **Server** | `app/server/` | Server-only Prisma-backed business logic |
| **Lib** | `app/lib/` | Infrastructure: auth, Prisma, RBAC, API helpers |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the detailed layering rules and import conventions.

## Directory Layout

```
app/
├── abstract/ui/        # StatCard, Modal (dumb components)
├── api/                # Route handlers
│   ├── auth/           # login, logout, me, setup
│   ├── users/          # user CRUD
│   └── farm/[entity]/  # dynamic CRUD per farm entity
├── base/
│   ├── hooks/          # useFarmData
│   └── services/       # farm-client, http-client, user-service
├── components/         # AuthShell, Sidebar, FieldMap
├── features/           # crops, dashboard, finance, inventory,
│                       # livestock, login, operations, shop, users
├── lib/                # api, auth, prisma, rbac, store
└── server/farm/        # entity-config, repository, scope, payload, lookups
```

## Implemented Modules

- **Dashboard** – KPIs, weather summary, task alerts, charts
- **Crops & Fields** – Field registry, map view, input logs, yield records, crop rotation
- **Livestock** – Animal registry, medical records, breeding records, weight tracking
- **Inventory** – Stock items, adjustments, batch records, traceability search
- **Shop / POS** – Products, checkout, sales history, profitability analytics
- **Operations** – Machinery registry, maintenance schedule, task board
- **Finance** – Expenses, revenue/expense charts, P&L reporting, category filtering
- **Users & Auth** – Setup wizard, login/logout, user management, 9 roles with RBAC

The long-term enterprise roadmap lives in [feature-plans.md](./feature-plans.md).

## Backend API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/setup` | Create first farm workspace and admin user |
| `POST` | `/api/auth/login` | Create HTTP-only session |
| `POST` | `/api/auth/logout` | Clear current session |
| `GET` | `/api/auth/me` | Read current auth/setup state |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List users in current farm |
| `POST` | `/api/users` | Create a farm user |
| `PATCH` | `/api/users/[id]` | Update role/status/profile/password |

### Farm Entities
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/farm/[entity]` | List farm-scoped records |
| `POST` | `/api/farm/[entity]` | Create a farm-scoped record |
| `PATCH` | `/api/farm/[entity]/[id]` | Update a farm-scoped record |
| `DELETE` | `/api/farm/[entity]/[id]` | Delete a farm-scoped record |

**Entity keys:** `fields`, `inputLogs`, `yieldRecords`, `animals`, `medicalRecords`, `breedingRecords`, `weightRecords`, `stockItems`, `stockAdjustments`, `batches`, `products`, `sales`, `machines`, `tasks`, `expenses`

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `FARM_MANAGER` | Manage crops, livestock, inventory, operations |
| `FIELD_WORKER` | Record field inputs and tasks |
| `LIVESTOCK_MANAGER` | Manage animal records |
| `INVENTORY_MANAGER` | Manage stock and batches |
| `SHOP_STAFF` | Operate POS and manage products |
| `ACCOUNTANT` | View and manage financial records |
| `VETERINARY` | Access medical and breeding records |
| `VIEWER` | Read-only access |

Permissions are centralized in `app/lib/rbac.ts`.

## Getting Started

### Prerequisites

- Node.js `20.x` or later
- npm (or yarn/pnpm)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client and create SQLite database
npx prisma generate
npx prisma db push

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first launch, the app redirects to `/login` and shows setup mode — create the first farm workspace and admin account there.

> **Windows (Cursor):** If `npx` is not on PATH:
> ```powershell
> $env:PATH='C:\Program Files\cursor\resources\app\resources\helpers;' + $env:PATH
> .\node_modules\.bin\prisma.CMD generate
> .\node_modules\.bin\prisma.CMD db push
> ```

### Quality Checks

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript check
npm run build       # Production build
```

## Database

- **Schema:** `prisma/schema.prisma` (17 models: Farm, User, Session, CropField, FieldRotation, InputLog, YieldRecord, Animal, MedicalRecord, BreedingRecord, WeightRecord, StockItem, StockAdjustment, BatchRecord, Product, SaleRecord, SaleItem, Machine, Task, ExpenseRecord)
- **File:** `prisma/dev.db` (SQLite, auto-created via `prisma db push`)
- All persistence goes through Prisma ORM — no direct SQL.

## Deployment

> ⚠ **SQLite note:** SQLite is a file-based database. It does **not** work on Vercel's serverless edge runtime (read-only filesystem). For production, use a persistent server environment or migrate to PostgreSQL (see below).

### Option A: Self-hosted (VPS / Dedicated Server)

Deploy as a standard Node.js application:

```bash
# 1. Clone and install
git clone <repo-url> farm-dashboard
cd farm-dashboard
npm install

# 2. Set environment variables
#    (optional — defaults work without env vars for SQLite)
#    Create a .env file in the project root:
echo "DATABASE_URL=\"file:./dev.db\"" > .env

# 3. Build for production
npm run build

# 4. Start the server
npm start
```

The app listens on `http://localhost:3000` by default. Set the `PORT` environment variable to change the port.

#### Process Management (PM2)

```bash
npm install -g pm2
pm2 start npm --name "farm-dashboard" -- start
pm2 save
pm2 startup   # configure auto-restart on reboot
```

#### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name farm.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then run `sudo certbot --nginx` for HTTPS.

### Option B: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.ts ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm start"]
```

```yaml
# docker-compose.yml
services:
  farmos:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - farmos-data:/app/prisma  # persist SQLite database
    restart: unless-stopped

volumes:
  farmos-data:
```

```bash
docker compose up -d
```

### Option C: Platform-as-a-Service

**Railway / Fly.io / Northflank** (supports persistent volumes):

1. Connect your Git repository
2. Set build command: `npm ci && npx prisma generate && npm run build`
3. Set start command: `npx prisma db push && npm start`
4. Attach a persistent volume at `/app/prisma` (for SQLite file durability)
5. Deploy

### Option D: Migrate to PostgreSQL (for Vercel / production scalability)

1. Install the PostgreSQL driver:
   ```bash
   npm install @prisma/adapter-pg
   ```
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Set `DATABASE_URL` in your hosting environment (Vercel, Render, etc.)
5. Deploy normally as a Next.js app.

> Switching to PostgreSQL unlocks Vercel deployment, connection pooling, and better concurrent write performance.

## Notes

- All application persistence should go through Prisma ORM, not direct SQL.
- Feature modules should not import from sibling feature folders.
- API routes should stay thin and delegate backend logic to `app/server`.
- Reusable UI belongs in `app/abstract`; shared client services/hooks belong in `app/base`.
- Environment variables (`.env*`) are gitignored — never commit secrets.
