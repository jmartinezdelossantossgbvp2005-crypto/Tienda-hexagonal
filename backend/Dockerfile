# Dockerfile for Backend (Node.js + Hexagonal Architecture)
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code and scripts
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY init.sql ./init.sql

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Security: Run as non-root user
USER node

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
