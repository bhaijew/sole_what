FROM node:22-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates git patch && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependency layer — cache-friendly: only rerun when package*.json changes
COPY package*.json ./
COPY .npmrc ./
COPY patches ./patches/
COPY prisma ./prisma/
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci --include=dev --legacy-peer-deps && npm cache clean --force

# Source & build
COPY . .
RUN node scripts/sync-db-provider.js && npx prisma generate && npm run build

# Strip devDeps from node_modules after build
# tsx needed at runtime, kept explicitly
RUN npm prune --omit=dev --legacy-peer-deps && npm install --no-save --legacy-peer-deps tsx typescript

# Production image
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/scripts ./scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["sh", "-c", "node scripts/sync-db-provider.js && ./node_modules/.bin/prisma generate && ./node_modules/.bin/prisma db push && node scripts/setup-admin.js && node node_modules/tsx/dist/cli.mjs src/server/index.ts"]
