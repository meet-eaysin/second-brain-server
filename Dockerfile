# Development stage
FROM node:22.15.1-alpine as development

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port (using the PORT variable from your env)
EXPOSE 5000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM node:22.15.1-alpine as production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start production server
CMD ["node", "dist/server.js"]