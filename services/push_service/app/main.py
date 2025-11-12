from fastapi import FastAPI, Request
from datetime import datetime
import pika
import uuid
import json
from loguru import logger
import threading
import asyncio
from fastapi.staticfiles import StaticFiles
import os
from app.consumer import start_consumer


app = FastAPI(
    title="Push Service",
    description="Microservice for handling web push notifications asynchronously via RabbitMQ.",
    version="1.1.0",
)
# Serve static files for web push test

web_push_dir = os.path.join(os.path.dirname(__file__), "web_push_test")
app.mount("/web_push_test", StaticFiles(directory=web_push_dir), name="web_push_test")

# Background Consumer Startup

def run_consumer_in_thread():
    """
    Starts the push notification consumer in a dedicated daemon thread.
    Ensures FastAPI server remains responsive.
    """
    try:
        threading.Thread(target=start_consumer, daemon=True).start()
        logger.info(" Push consumer thread started successfully.")
    except Exception as e:
        logger.exception(f" Failed to start consumer thread: {e}")

@app.on_event("startup")
async def startup_event():
    """
    Startup event — runs the consumer in a background thread
    and performs async readiness checks if needed.
    """

    logger.info(" Initializing Push Service...")
    run_consumer_in_thread()
    logger.info(" Push Service startup complete.")

# Health Check Endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "push_service",
        "timestamp": datetime.utcnow().isoformat(),
        "description": "Handles web push notifications via RabbitMQ → Redis → WebPush",
    }

# VAPID Public Key Endpoint
@app.get("/vapid_public_key")
async def get_vapid_public_key():
    public_key = os.getenv("VAPID_PUBLIC_KEY")
    if not public_key:
        logger.error(" VAPID_PUBLIC_KEY not set in environment!")
        return {"error": "VAPID public key not available"}
    return {"public_key": public_key}

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
QUEUE_NAME = "push.queue"

def publish_subscription_to_queue(subscription, user_id="web_user_auto"):
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        message = {
            "notification_id": str(uuid.uuid4()),
            "user_id": user_id,
            "devices": [subscription],
            "title": "Welcome! ",
            "body": "You have successfully subscribed for web push notifications.",
            "action_url": "https://example.com"
        }

        channel.basic_publish(
            exchange="",
            routing_key=QUEUE_NAME,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        connection.close()
        logger.success(" Subscription pushed to RabbitMQ.")
    except Exception as e:
        logger.error(f" Failed to push subscription: {e}")

@app.post("/subscribe")
async def subscribe(request: Request):
    """
    Receives subscription JSON from browser and pushes it to RabbitMQ.
    """
    try:
        subscription = await request.json()
        publish_subscription_to_queue(subscription)
        return {"status": "ok", "message": "Subscription received and queued."}
    except Exception as e:
        logger.error(f" Error handling subscription: {e}")
        return {"status": "error", "message": str(e)}