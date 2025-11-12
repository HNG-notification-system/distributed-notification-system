#  Push Notification Service

# Use official Python image (lightweight)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy only requirements first (improves build caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose FastAPI port
EXPOSE 3004

# Ensure logs are flushed immediately
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3004"]
