# Production image
FROM node:22.15.1-alpine AS production

WORKDIR /app

# Enable Corepack and Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy everything Yarn needs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.pnp.* ./

# Run with Yarn’s PnP loader
CMD ["yarn", "node", "dist/index.js"]
