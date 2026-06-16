ARG NODE_IMAGE=node:22.22.0-slim

FROM ${NODE_IMAGE} AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --include=optional --no-audit --no-fund

FROM base AS builder
ENV DATABASE_URL="file:/app/data/home-storage.db"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/data /app/uploads /app/backups
RUN npx prisma generate
RUN node node_modules/next/dist/bin/next build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/home-storage.db"

RUN mkdir -p /app/data /app/uploads /app/backups /app/.next/cache \
  && chown -R node:node /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/docker ./docker
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=node:node /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=node:node /app/node_modules/@img ./node_modules/@img
COPY --from=builder --chown=node:node /app/node_modules/detect-libc ./node_modules/detect-libc
COPY --from=builder --chown=node:node /app/node_modules/semver ./node_modules/semver

RUN node -e "const sharp = require('sharp'); console.log('sharp runtime ok', sharp.versions.vips)"

USER node

EXPOSE 3000

CMD ["sh", "-c", "node docker/init-db.mjs && node server.js"]
