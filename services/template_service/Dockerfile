FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify the build
RUN echo "=== Build verification ===" && \
    ls -la && \
    echo "=== Dist contents ===" && \
    ls -la dist/ && \
    echo "=== Main files ===" && \
    find dist/ -name "main.*" -type f

# Use the node user that already exists in the image
USER node

# Expose port
EXPOSE 3003

# Health check (simplified for now)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3003/api/v1/health || exit 1

# Start the app
CMD ["node", "dist/main"]