# Robustify

An ERP for printing presses. Orders move through the shop floor stage by stage (design, montage,
printing, cutting, packaging, delivery), each stage owned by its department. Materials are tracked
from purchase to stock to press, and managers see utilization, the order queue, quality costs and
invoices in one place.

> **Status:** being rebuilt. Phase 1 (this foundation) is in place; the API modules and the new UI
> follow. The original 2023 JavaScript version lives in this repository's history and in
> [Robustify-Frontend](https://github.com/ahmadalshawakri/Robustify-Frontend).

## Stack

| Part              | Tech                                                          |
| ----------------- | ------------------------------------------------------------- |
| `apps/web`        | React 19, Vite, TypeScript, MUI, TanStack Query               |
| `apps/api`        | Node 22, Express 5, TypeScript, Prisma, PostgreSQL, pino      |
| `packages/shared` | Domain enums, material catalogue, order workflow, zod schemas |
| Tooling           | pnpm workspaces, ESLint, Prettier, Vitest, GitHub Actions     |

The API and the web app share one set of validation schemas and constants, so a form and the
endpoint behind it cannot disagree. In production a single container serves both, on one origin.

## Getting started

Requirements: Node 22, pnpm 10 (`corepack enable`), Docker (for the local database).

```sh
pnpm install
docker compose up -d db
cp .env.example apps/api/.env
pnpm db:migrate        # create the schema
pnpm db:seed           # load the demo press (password for every account: demo1234)
pnpm dev               # API on :3001, web on http://localhost:5173
```

Demo accounts follow `firstname.lastname`: `layla.mansour` is the admin; `omar.haddad` (design),
`yousef.ali` (printing) and `tarek.hamdan` (delivery) are employees, among others.

## Scripts

| Command                          | What it does                                 |
| -------------------------------- | -------------------------------------------- |
| `pnpm dev`                       | Run the API and the web app with reload      |
| `pnpm lint` / `pnpm typecheck`   | ESLint and TypeScript across the workspace   |
| `pnpm test`                      | Unit and HTTP tests                          |
| `pnpm build`                     | Bundle the API and build the web app         |
| `pnpm db:migrate`                | Create a migration from schema changes (dev) |
| `pnpm db:deploy`                 | Apply migrations (production)                |
| `pnpm db:seed` / `pnpm db:reset` | Reload demo data / drop, migrate and reseed  |

## Production

```sh
docker build -t robustify .
docker run -p 3001:3001 -e DATABASE_URL=... -e SESSION_SECRET=... robustify
```

The container applies pending migrations on start, then serves the API under `/api` and the web
app everywhere else. `GET /api/health` checks the database. The app refuses to start when
`DATABASE_URL` or a 32+ character `SESSION_SECRET` is missing.

## Project layout

```
apps/
  api/        Express API, Prisma schema, migrations and seed
  web/        React single-page app
packages/
  shared/     Code used by both apps
```
