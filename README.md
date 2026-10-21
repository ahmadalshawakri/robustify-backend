# Robustify

An ERP for printing presses. Orders move through the shop floor stage by stage (design, montage,
printing, cutting, packaging, delivery), each stage owned by its department. Materials are tracked
from purchase to stock to press, and managers see utilization, the order queue, quality costs and
invoices in one place.

> **Status:** rebuilt; deployment comes next. The original 2023 JavaScript version lives in this repository's history and in
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

## API

All endpoints live under `/api` and speak JSON. Errors always look like
`{ "error": { "code": "...", "message": "...", "details": [...] } }`.

Sign-in sets an httpOnly, `SameSite=Strict` session cookie (8 hours); the token is never exposed to
JavaScript and only its HMAC is stored. Sign-in is rate-limited per IP.

| Area       | Endpoints                                                                                                | Who                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Auth       | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                                                  | Anyone                              |
| Users      | `GET POST /users`, `PATCH DELETE /users/:id`, `GET /users/utilization`                                   | Admin                               |
| Contacts   | `GET /contacts?type=&q=`                                                                                 | Admin                               |
| Orders     | `GET /orders`, `GET /orders/:id`, `POST /orders/:id/advance`                                             | Admin; employees for their own work |
| Orders     | `POST /orders`, `POST /orders/:id/assign`, `DELETE /orders/:id`                                          | Admin                               |
| Purchases  | `GET POST /purchases`, `GET /purchases/:id`, `POST /purchases/:id/receive`, `POST /purchases/:id/cancel` | Admin                               |
| Inventory  | `GET /inventory`                                                                                         | Signed in                           |
| Complaints | `GET /complaints`                                                                                        | Admin; employees see their own      |
| Complaints | `POST /complaints`, `PATCH /complaints/:id`                                                              | Admin                               |
| Invoices   | `GET POST /invoices`, `GET /invoices/:id`, `GET /invoices/sales-report?months=`                          | Admin                               |
| Quality    | `GET POST /quality-costs?months=`, `DELETE /quality-costs/:id`                                           | Admin                               |
| Dashboard  | `GET /dashboard`                                                                                         | Admin                               |

How the press works in the API:

- **Stages.** An order moves Not started, Design, Montage, Printing, Cutting, Packaging, In transit,
  Completed, one step at a time. Each stage belongs to a department; only that department (or an
  admin) can move it on, and it can only be assigned to someone in that department. Every move is
  recorded in the order's history.
- **Employees** see orders assigned to them plus orders waiting in their department's stage.
- **Stock.** Purchases are counted in packs; receiving them adds `packs × pack size` to stock (paper
  in metres, ink and varnish in millilitres). Moving an order into printing takes its paper out of
  stock and is refused when there is not enough.
- **After delivery.** Complaints can be logged once an order has shipped, with who was responsible
  and what putting it right cost. Completed orders are invoiced once each, numbered
  `INV-<year>-<seq>`, with 16% tax; the sales report sums revenue by month and ranks customers.
- **Cost of quality** compares money spent preventing defects (maintenance, training, equipment,
  inspection) with money lost to them (defects, rework, lost customers, and complaint costs), per
  month. The share spent on poor quality is the number to push down.
- **Utilization** is the estimated time of an employee's open work in their own stage, as a share of
  one 8-hour day. Over 100% means overloaded.

## The web app

Admins get a dashboard (queue by stage, overdue orders, low stock, team utilization), orders with a
stage-by-stage detail page, purchases with partial receipts, stock and a team page to manage
accounts, plus sales with printable invoices, complaints, and cost of quality. Employees land on
**My work**: what is assigned to them and what is waiting in their stage, with one button to move
an order on, and they see the complaints they are responsible for. Forms validate with the same zod schemas as the API,
and the layout works down to phone width.

## Testing

`pnpm test` needs Postgres. API tests run against a separate `<database>_test` database derived from
`DATABASE_URL`, migrate it automatically, and empty it before each test, so development data is never
touched. Web tests run in jsdom against a stubbed API and need nothing else.

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
