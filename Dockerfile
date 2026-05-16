# syntax=docker/dockerfile:1

# --- Build stage ---------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app
# Prisma's engines need OpenSSL; node:20-slim does not ship it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# Install dependencies first for layer caching. `prisma` is copied before
# install so the `postinstall` script (prisma generate) finds the schema.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Build the app (produces dist/client and dist/server).
COPY . .
RUN pnpm build

# --- Runtime stage -------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Prisma's query engine and `migrate deploy` need OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# node_modules from the builder already contains the generated Prisma
# client and the prisma CLI used for `migrate deploy` at startup.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
# `prisma db seed` runs prisma/seed.ts with tsx, which imports the
# argon2 password helper from src/ — so the source tree is needed too.
COPY --from=builder /app/src ./src

EXPOSE 3000

# Apply any pending migrations, then start the server.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node server.js"]
