#!/bin/sh
set -e
echo "Waiting for database to be ready..."
until PGPASSWORD=${POSTGRES_PASSWORD:-admin123} psql -h ${DB_HOST:-postgres} -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-notification_system} -c "SELECT 1;" > /dev/null 2>&1; do
  echo "Database not ready yet - sleeping..."
  sleep 2
done
echo "Database is ready - running migrations..."
npx prisma migrate deploy
echo "Migrations completed - starting application..."
exec node dist/src/main.js
