# Farm Dashboard Architecture

This project follows a four-layer modular architecture inspired by the App,
Feature, Base, and Abstract layering described in Priyank Lad's Next.js modular
architecture article.

## 1. App Layer

Location: `app/**/page.tsx`, `app/layout.tsx`, `app/api/**`

Responsibilities:

- Next.js routing and route handlers.
- Global layout and auth shell wiring.
- Thin route wrappers only. Page-level UI should live in `app/features`.
- API routes should delegate business/data work to server modules.

## 2. Feature Layer

Location: `app/features/<feature>`

Responsibilities:

- Feature-specific screens, state, tabs, and forms.
- Farm modules such as crops, livestock, inventory, shop, operations, finance,
  users, login, and dashboard.
- Features may use Base services/hooks and Abstract UI, but should not import
  from other feature folders.

## 3. Base Layer

Location: `app/base`

Responsibilities:

- Smart client services and hooks.
- API client wrappers such as `farm-client`, `user-service`, and `http-client`.
- Shared data orchestration like `useFarmData`.
- Business-facing helpers that features depend on.

## 4. Abstract Layer

Location: `app/abstract`

Responsibilities:

- Reusable dumb UI components.
- Generic UI primitives such as modal and stat card.
- No feature-specific data fetching or business logic.

## Backend Server Modules

Location: `app/server`

Responsibilities:

- Server-only business logic used by API routes.
- Prisma-backed repositories and domain rules.
- Entity configuration, scope filters, payload normalization, and related-record
  lookups are split under `app/server/farm`.

## Import Rules

- `app/**/page.tsx` may import from `app/features`.
- Features may import from `app/base`, `app/abstract`, and shared `app/components`
  compatibility wrappers.
- Features should not import from sibling feature folders.
- API routes should be thin and import server work from `app/server`.
- Server modules may import Prisma/auth/RBAC utilities from `app/lib`.
