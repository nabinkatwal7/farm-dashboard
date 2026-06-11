# FarmOS Dashboard

FarmOS is a modular Next.js farm management dashboard with a Prisma + SQLite backend. It covers crop records, livestock records, inventory, batch traceability, POS sales, operations, finance, authentication, and role-based user management.

## Tech Stack

- Next.js `16.2.9` App Router
- React `19`
- TypeScript
- Prisma ORM
- SQLite local database
- bcrypt-backed password hashing
- HTTP-only database sessions
- ESLint + TypeScript checks

## Architecture

The project follows a layered modular architecture:

- `app/**/page.tsx` - App layer route wrappers and Next.js routing
- `app/features/*` - Feature screens such as crops, livestock, inventory, shop, finance, users, and dashboard
- `app/base/*` - Shared hooks and client-side services
- `app/abstract/*` - Reusable presentation-only UI components
- `app/server/*` - Server-only backend modules used by API routes
- `app/lib/*` - Infrastructure utilities such as auth, Prisma, RBAC, and API helpers

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the detailed layering rules.

## Implemented Modules

- Dashboard KPIs, weather summary, task alerts, and charts
- Crops and field records with map view, input logs, and yield records
- Livestock registry, medical records, breeding records, and weight records
- Inventory stock records, stock adjustments, batch records, and traceability search
- Shop/POS products, checkout, sales history, and profitability analytics
- Operations machinery registry, maintenance indicators, and task board
- Finance expenses, revenue/expense charts, P&L reporting, and category filtering
- Auth setup, login/logout, user creation, active/inactive users, and role-based access

The long-term enterprise roadmap lives in [feature-plans.md](./feature-plans.md). Checked items in that file represent implemented MVP/foundation coverage.

## Backend API

Auth:

- `POST /api/auth/setup` - create the first farm workspace and admin user
- `POST /api/auth/login` - create an HTTP-only session
- `POST /api/auth/logout` - clear the current session
- `GET /api/auth/me` - read current auth/setup state

Users:

- `GET /api/users` - list users in the current farm
- `POST /api/users` - create a farm user
- `PATCH /api/users/[id]` - update role/status/profile/password fields

Farm entities:

- `GET /api/farm/[entity]` - list farm-scoped records
- `POST /api/farm/[entity]` - create a farm-scoped record
- `PATCH /api/farm/[entity]/[id]` - update a farm-scoped record
- `DELETE /api/farm/[entity]/[id]` - delete a farm-scoped record

Current entity keys include `fields`, `inputLogs`, `yieldRecords`, `animals`, `medicalRecords`, `breedingRecords`, `weightRecords`, `stockItems`, `stockAdjustments`, `batches`, `products`, `sales`, `machines`, `tasks`, and `expenses`.

## Roles

Supported roles are:

- `ADMIN`
- `FARM_MANAGER`
- `FIELD_WORKER`
- `LIVESTOCK_MANAGER`
- `INVENTORY_MANAGER`
- `SHOP_STAFF`
- `ACCOUNTANT`
- `VETERINARY`
- `VIEWER`

Role permissions are centralized in `app/lib/rbac.ts`.

## Database

Prisma schema:

```text
prisma/schema.prisma
```

SQLite database:

```text
prisma/dev.db
```

Regenerate Prisma Client:

```bash
npx prisma generate
```

Sync schema to SQLite:

```bash
npx prisma db push
```

On this Windows workspace, if `npx` is not on PATH, use the local binary:

```powershell
$env:PATH='C:\Program Files\cursor\resources\app\resources\helpers;' + $env:PATH
.\node_modules\.bin\prisma.CMD generate
.\node_modules\.bin\prisma.CMD db push
```

## Getting Started

Install dependencies:

```bash
npm install
```

Generate Prisma Client and sync the database:

```bash
npx prisma generate
npx prisma db push
```

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

On first launch, the app redirects to `/login` and shows setup mode. Create the first farm workspace and admin account there.

## Quality Checks

Run lint:

```bash
npm run lint
```

Run TypeScript:

```bash
npx tsc --noEmit
```

Run production build:

```bash
npm run build
```

## Notes

- All application persistence should go through Prisma ORM, not direct SQL.
- Feature modules should not import from sibling feature folders.
- API routes should stay thin and delegate backend logic to `app/server`.
- Reusable UI belongs in `app/abstract`; shared client services/hooks belong in `app/base`.
