# Case study: rebuilding Robustify

Robustify is an ERP for label and packaging printing presses. An order moves through design,
montage, printing, cutting, packaging and delivery. Each stage belongs to a department, and paper,
ink and varnish are bought, stocked and used up along the way.

The first version was written in 2023 as two JavaScript repositories: a React app and an Express
API using Sequelize. In 2026 it was rebuilt from scratch. This page covers what the old version
got wrong, what the rebuild changed, and why.

## Where it started

The old code was small: about 1,100 lines of backend and 3,100 lines of frontend. Only about 40%
of it worked.

- Of 15 screens, 3 worked fully, 6 worked partly and 6 were empty: stock, complaints, invoices,
  sales and both employee screens.
- Every backend route was admin-only, so employees could sign in but couldn't do anything.
- A code review found 13 bugs. Examples:
  - deleting a user crashed the request;
  - picking a deadline on the new-order form threw an error;
  - the user list filtered by the admin's own department, so it was always empty;
  - utilization counted every order ever assigned, so it grew without limit.
- Cost of quality lived in component state and was gone after a refresh. Its chart labels were
  also swapped.

It also could not have gone live:

- Every server start created an admin account with the password `123456789`.
- The dependencies had over 100 known vulnerabilities, 10 of them critical.
- The API address was hard-coded to `localhost`.
- The database schema was managed with `sync()`, with no migrations.

Fixing all of that in place would have cost more than rewriting it, so it was rewritten, keeping
the domain model and the workflow.

## What the rebuild changed

**One TypeScript monorepo.** There are three pieces:

- `apps/api`: Express 5 and Prisma;
- `apps/web`: React 19, MUI and TanStack Query;
- `packages/shared`: what both sides agree on, such as the zod schemas, the stage order, which
  department owns which stage, the material catalogue and pack sizes, and the tax rate.

A form validates with the same schema as the endpoint behind it, so the two cannot drift apart. A
test also fails if the database enums and the shared constants ever disagree.

**The workflow is enforced on the server.**

- Orders move exactly one stage at a time. Only the department that owns the current stage, or
  an admin, can move it on.
- The next assignee must belong to the next stage's department.
- The status update is conditional on the old status, so two people clicking at once can't skip a
  stage.
- Every move is written to an audit trail.

**Stock is real.**

- Purchases are counted in packs, and receiving them adds `packs × pack size` to stock.
- Moving an order into printing takes its paper out of stock in the same transaction. The move is
  refused, with a clear message, if there isn't enough.

**Numbers mean something.**

- Utilization is the estimated time of an employee's open work in their own stage, as a share of
  an 8-hour day.
- Cost of quality is stored per month and compares prevention spending with failure spending.
  Complaint costs count as failures automatically.
- Invoices are numbered per year and taxed from one shared rate.

**Security basics.**

- Sessions are random tokens in httpOnly, SameSite=Strict cookies. Only an HMAC of each token is
  stored.
- Sign-in is rate-limited, and unknown users take as long to refuse as wrong passwords.
- Passwords are hashed with bcrypt.
- The app refuses to start without a strong session secret. It ships with no default accounts.

**Tests at three levels.**

- 56 API tests run over HTTP against a real Postgres. They cover the full order lifecycle,
  permissions, stock, invoices and the demo reset.
- The shared logic has unit tests.
- The web app has component tests against a stubbed API.
- Playwright smoke tests drive the built app in a browser, on desktop and on a phone, on every
  pull request.

## Shipping it as a demo

The live demo is one Docker container on Render's free tier, with Postgres on Neon.

- The container applies migrations when it starts and serves the API and the web app from one
  origin, so there's no CORS to configure.
- Demo mode adds one-click sign-in as an admin, a designer or a printer.
- Demo mode reseeds the data once a day. A free instance sleeps when idle, so the check runs when
  the app starts and then hourly. A Postgres advisory lock stops two instances from resetting at
  once.
- The seed is deterministic, and its dates are relative to today, so the demo always looks
  current: overdue orders, this month's revenue, and a cost-of-quality trend.
- Demo mode also protects the demo accounts, so one visitor can't lock the next one out.

## Things a bug taught along the way

The new browser smoke test caught a real race on its first run. Sign-out cleared the whole query
cache while the route guards were still subscribed to the cached session, so sometimes the old
user stayed on screen next to a "Please sign in" error. The fix marks the session as signed out
first, then drops the rest of the cache.
