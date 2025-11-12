FROM node:20-alpine

WORKDIR /app

# Install curl and postgresql-client for database checks
RUN apk add --no-cache curl postgresql-client

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies - CHANGED THIS LINE
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create startup script that waits for DB and runs migrations
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /app/start.sh && \
    echo 'until PGPASSWORD=admin123 psql -h postgres -U admin -d notification_system -c "SELECT 1;" > /dev/null 2>&1; do' >> /app/start.sh && \
    echo '  echo "Database not ready yet - sleeping..."' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "Database is ready - running migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Migrations completed - starting application..."' >> /app/start.sh && \
    echo 'exec node dist/src/main.js' >> /app/start.sh

RUN chmod +x /app/start.sh

USER node
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3003/api/v1/health || exit 1

CMD ["/app/start.sh"]