FROM node:22-alpine AS base
WORKDIR /app

# ---- all dependencies (used by dev + build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- development: hot reload via bind mount (see docker-compose.yml) ----
# On start: apply pending migrations, regenerate the Prisma client, then watch.
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev:docker"]

# ---- build ----
# `prisma generate` loads prisma.config.ts, which requires DATABASE_URL to be set (it never connects).
FROM deps AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY . .
RUN npm run build

# ---- production dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- production runtime ----
# Migrations are NOT run on start; run `npx prisma migrate deploy` as a separate release step.
FROM base AS prod
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
