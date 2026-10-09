# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

# prisma.config.ts reads env("DATABASE_URL"); generate never connects, so a
# placeholder satisfies it at build time (real URL is injected at runtime).
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/postgres
RUN npx prisma generate
RUN npx tsc -b

# ---- runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

EXPOSE 3002
CMD ["node", "dist/index.js"]
