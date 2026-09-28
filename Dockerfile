FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/runtime-scripts ./scripts
COPY --from=builder /app/migrations ./migrations
# Next.js standalone tracing omits this native library even though sharp itself is copied.
COPY --from=deps /app/node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@1.3.2/node_modules/@img/sharp-libvips-linuxmusl-x64/lib/ /app/node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@1.3.2/node_modules/@img/sharp-libvips-linuxmusl-x64/lib/
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /app /data/uploads
USER nextjs
RUN node -e "require('sharp').versions.vips"
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
