# syntax=docker/dockerfile:1

# --- Build stage ---------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app
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
RUN corepack enable

# node_modules from the builder already contains the generated Prisma
# client and the prisma CLI used for `migrate deploy` at startup.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000

# Apply any pending migrations, then start the server.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node server.js"]
