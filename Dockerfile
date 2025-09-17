# Base image
FROM node:22.15.1-alpine AS builder

WORKDIR /app

# Copy only package metadata for caching
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies in PnP mode
RUN yarn install --immutable

# Copy source code
COPY . .

# Build if needed (e.g., TypeScript)
RUN yarn build:production

# Production image
FROM node:22.15.1-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expressapp -u 1001

# Copy PnP files and built code
COPY --from=builder --chown=expressapp:nodejs /app/.yarn ./.yarn
COPY --from=builder --chown=expressapp:nodejs /app/.yarnrc.yml ./
COPY --from=builder --chown=expressapp:nodejs /app/dist ./dist

# Switch to non-root
USER expressapp

# Expose port
EXPOSE 5000

# Run Express app using Yarn PnP
CMD ["yarn", "node", "dist/index.js"]
