# ---- base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- deps ----
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# All workspace package.json files (pnpm requires full workspace resolution)
COPY apps/os/package.json ./apps/os/
COPY apps/back-office/package.json ./apps/back-office/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/api/package.json ./packages/api/
COPY packages/store/package.json ./packages/store/
COPY packages/auth/package.json ./packages/auth/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/

RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./
COPY . .

RUN pnpm turbo build --filter=@heritage-dx/back-office

# ---- runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output (outputFileTracingRoot = monorepo root)
COPY --from=builder --chown=nextjs:nodejs /app/apps/back-office/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/back-office/.next/static ./apps/back-office/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/back-office/server.js"]
