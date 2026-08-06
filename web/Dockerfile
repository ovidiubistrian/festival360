# Festival Hub web (Next.js) — standalone production image
# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined at build time (including in middleware).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_PLATFORM_DOMAIN=siteora.ro
ENV NEXT_PUBLIC_PLATFORM_DOMAIN=${NEXT_PUBLIC_PLATFORM_DOMAIN}
ENV NEXT_TELEMETRY_DISABLED=1
# Give Next's build room (the app has many routes) so CI doesn't OOM-kill it.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs nextjs

# Standalone output + static assets + public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
