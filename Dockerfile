# syntax=docker/dockerfile:1
#
# Production images for Mahjong Dynasty: Dragon Fortune (DEMO CREDITS only).
# One Dockerfile, four targets (build them from the repository root):
#
#   docker build --target api     -t mahjong-api .      Express API server
#   docker build --target web     -t mahjong-web .      nginx: static web app + /api reverse proxy
#   docker build --target migrate -t mahjong-migrate .  one-shot `prisma migrate deploy`
#
# Or run everything together:  docker compose -f docker-compose.prod.yml up --build
# (see README, "Docker deployment").

ARG NODE_VERSION=22

# ---------------------------------------------------------------- base
# Debian (glibc) rather than Alpine: Prisma and bcrypt ship prebuilt binaries for it.
FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------- build
# Full dependency install + compile the API bundle and the web app.
FROM base AS build
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
# The root postinstall runs `prisma generate`, which needs the schema, so copy it first. Running the
# install scripts also downloads the Prisma engines that `migrate deploy` needs later.
COPY apps/api/prisma apps/api/prisma
RUN npm ci
COPY . .
RUN npm run build

# ---------------------------------------------------------------- migrate
# Applies the SQL migrations, then exits. Needs the Prisma CLI, so it reuses the build stage.
FROM build AS migrate
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy", "--schema", "apps/api/prisma/schema.prisma"]

# ---------------------------------------------------------------- api-deps
FROM base AS api-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY e2e/package.json e2e/
RUN npm ci --omit=dev --ignore-scripts -w @mahjong/api

# ---------------------------------------------------------------- api
FROM base AS api
ENV NODE_ENV=production
ENV API_PORT=4000
# Production dependencies only, plus the Prisma client that was generated in the build stage.
COPY --from=api-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
# apps/api/package.json is needed at runtime: it marks dist/server.js as an ES module.
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]

# ---------------------------------------------------------------- web
# Static files + reverse proxy to the API on the same origin (so the auth cookie just works).
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=6 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
