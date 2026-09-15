# Tracky — Personal Data Dashboard

Tracky is a personal analytics app: users define their own **metrics** (numeric, scale, or
boolean), log one **entry** per metric per day, and visualize trends by placing configurable
**widgets** (line / bar / stat / streak) onto named **dashboards**. All data is strictly
private and owner-scoped; an **admin** role provides read-only oversight and user management.

- **Backend:** Laravel 13 REST API · SQLite · Laravel Breeze (API) · Laravel Sanctum (Bearer tokens)
- **Frontend:** React + TypeScript (Vite) · React Router · TanStack Query · Tailwind CSS · Flowbite · Recharts · dnd-kit
- **Tests:** PHPUnit feature tests (backend) · Cypress E2E (frontend)

```
Tracky/
├── backend/    Laravel REST API
└── frontend/   React + TypeScript SPA
```

## Prerequisites

- PHP 8.2+ with `pdo_sqlite`, Composer 2
- Node.js 20+ and npm

## Setup

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed     # creates tables + demo data
php artisan serve              # http://127.0.0.1:8000
```

SQLite is used by default; `php artisan migrate` auto-creates `database/database.sqlite`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend on port 8000, so both must be running.

Open **http://localhost:5173**.

## Demo accounts (from the seeder)

| Role  | Email              | Password   |
| ----- | ------------------ | ---------- |
| User  | `demo@tracky.test` | `password` |
| Admin | `admin@tracky.test`| `password` |

The demo user comes with sample metrics, ~21 days of entries, and a populated "My Health" dashboard.

## Useful commands

```bash
# Backend
php artisan migrate:fresh --seed     # reset DB + reseed
php artisan tracky:make-admin you@example.com   # promote a user to admin
php artisan test                     # run feature tests

# Frontend
npm run build                        # type-check + production build
npm run typecheck                    # tsc only
npm run e2e                          # Cypress headless (servers must be running)
npm run cypress:open                 # Cypress interactive
```

## Authentication

Sanctum **API tokens**: `POST /api/register` and `POST /api/login` return a Bearer token that
the SPA stores and sends as `Authorization: Bearer <token>`. `POST /api/logout` revokes it.

## Authorization model

Three enforced layers (defense in depth), all server-side:

1. **Middleware** — `auth:sanctum` on all protected routes; an `admin` middleware guards `/api/admin/*`.
2. **Policies** — `view` allows owner **or** admin; `create/update/delete` allow the **owner only**
   (admins are read-only on user data — data integrity stays with the owner).
3. **Query scoping** — every list endpoint filters by `auth()->id()` at the query level, so foreign
   records never enter a response even with crafted requests.

Frontend route guards are a UX convenience only and are never relied upon for security.

## Data model

| Table        | Responsibility                                                     |
| ------------ | ----------------------------------------------------------------- |
| `users`      | Auth + profile; root owner of all data; `role` (user/admin)       |
| `metrics`    | A user-defined measurement (numeric/scale/boolean) — owned by user |
| `entries`    | One logged value per metric per day — **core 1:N child of metric** |
| `dashboards` | A named collection of widgets — owned by user                     |
| `widgets`    | A chart bound to one metric on a dashboard (line/bar/stat/streak)  |

Key relationships: `users 1→N metrics`, `metrics 1→N entries` (primary active 1:N),
`users 1→N dashboards`, `dashboards 1→N widgets`, `metrics 1→N widgets`.
`UNIQUE(metric_id, logged_date)` enforces one entry per metric per day.

## API overview

All routes are prefixed `/api`. Owner-scoped resources expose full CRUD.

- **Auth:** `POST /register`, `POST /login`, `POST /logout`, `GET/PATCH /user`
- **Metrics** (owner): `GET/POST /metrics`, `GET/PATCH/DELETE /metrics/{id}`, `GET /metrics/{id}/entries`
- **Entries** (owner): `GET/POST /entries`, `POST /entries/bulk`, `GET/PATCH/DELETE /entries/{id}`
- **Dashboards** (owner): `GET/POST /dashboards`, `GET/PATCH/DELETE /dashboards/{id}`
- **Widgets** (owner): `GET/POST /dashboards/{id}/widgets`, `PATCH /dashboards/{id}/widgets/reorder`,
  `GET/PATCH/DELETE /widgets/{id}`
- **Admin** (role): `GET /admin/users`, `GET/PATCH/DELETE /admin/users/{id}`

## Notable features

- **Multi-step widget configurator** — Select Metric → Choose Chart → Configure, with chart types
  filtered by metric type and config fields that depend on the chosen chart.
- **Drag-and-drop widget reordering** — optimistic reorder with rollback on failure (dnd-kit).
- **Responsive UI** — desktop sidebar collapses to a mobile bottom tab bar; tables become stacked cards.
