# =========================
# Builder stage
# =========================
FROM node:22.15.1-alpine AS builder

WORKDIR /app

# Enable Corepack and activate Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy package manager configs and lockfile
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies (immutable / PnP)
RUN yarn install --immutable

# Copy full source code
COPY . .

# Build the app (TypeScript or whatever build step you have)
RUN yarn build:production

# =========================
# Production stage
# =========================
FROM node:22.15.1-alpine AS production

WORKDIR /app

# Enable Corepack and Yarn 4 in production
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy built files and Yarn PnP setup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/.yarnrc.yml ./

# Optional: Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', res => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the app using Yarn PnP
CMD ["yarn", "node", "dist/index.js"]
