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

# NEXT_PUBLIC_* vars must be present at build time
ARG NEXT_PUBLIC_NAVER_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_CLIENT_ID=$NEXT_PUBLIC_NAVER_CLIENT_ID
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID

RUN pnpm turbo build --filter=@heritage-dx/os

# ---- runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output (outputFileTracingRoot = monorepo root)
COPY --from=builder --chown=nextjs:nodejs /app/apps/os/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/os/.next/static ./apps/os/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Firebase Admin SDK (set via Cloud Run env vars)
# ENV FIREBASE_SERVICE_ACCOUNT_KEY=

CMD ["node", "apps/os/server.js"]
