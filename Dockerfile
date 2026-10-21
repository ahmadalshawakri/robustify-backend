# One image serves the API and the built web app.

FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @robustify/api db:generate && pnpm build
# A self-contained copy of the API with production dependencies only.
RUN pnpm --filter @robustify/api deploy --prod --legacy /out \
  && cd /out && node_modules/.bin/prisma generate

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3001 \
    WEB_DIST=/app/web
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /repo/apps/web/dist ./web
USER node
EXPOSE 3001
# Apply pending migrations, then start.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/server.js"]
