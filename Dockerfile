# Base Node image
FROM node:22.15.1-alpine AS base

WORKDIR /app

# Enable Corepack & Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (dev dependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# -------------------
# Build stage
# -------------------
FROM base AS builder

# Build the app
RUN yarn build:production

# -------------------
# Production stage
# -------------------
FROM node:22.15.1-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app

# Copy build artifacts + node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]

# -------------------
# Development stage
# -------------------
FROM base AS development

WORKDIR /app
EXPOSE 5000
CMD ["yarn", "dev"]
