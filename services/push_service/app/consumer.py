import os
import json
import asyncio
import ssl
import time
import pika
from datetime import datetime
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.redis_client import init_redis
from app.webpush_client import send_webpush_message  
from app.user_client import mark_token_invalid

# Environment variables
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE_NAME", "push.queue")


# Helper: update status in Redis
async def update_notification_status(redis, notification_id, status, metadata=None):
    metadata = metadata or {}
    status_data = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat(),
        **metadata
    }
    await redis.set(f"notification:{notification_id}", json.dumps(status_data), ex=86400)


# Web push delivery handler
@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, max=30))
async def process_subscription(subscription, notification_id, user_id, title, body, action_url):
    try:
        data = {"notification_id": notification_id, "action_url": action_url or ""}
        response = await send_webpush_message(subscription, title, body, data)
        return {"endpoint": subscription.get("endpoint"), "message_id": response}
    except Exception as e:
        # Handle invalid or expired subscriptions
        if "410" in str(e) or "invalid" in str(e).lower():
            await mark_token_invalid(user_id, subscription.get("endpoint"))
            return {"endpoint": subscription.get("endpoint"), "invalid": True}
        raise e


# Process message from queue
async def process_message(redis, body):
    msg = json.loads(body)
    notification_id = msg.get("notification_id")
    user_id = msg.get("user_id")
    subscriptions = msg.get("devices", [])  
    title = msg.get("title")
    body_text = msg.get("body")
    action_url = msg.get("action_url")

    await update_notification_status(redis, notification_id, "processing")

    success, failed, invalid = [], [], []

    for subscription in subscriptions:
        try:
            res = await process_subscription(subscription, notification_id, user_id, title, body_text, action_url)
            if res.get("invalid"):
                invalid.append(res["endpoint"])
            else:
                success.append(res)
        except Exception as e:
            failed.append({"endpoint": subscription.get("endpoint"), "error": str(e)})
            logger.error(f"Failed to send web push to {subscription.get('endpoint')}: {e}")

    overall_status = "sent" if success else "failed"

    await update_notification_status(redis, notification_id, overall_status, {
        "success_count": len(success),
        "failed_count": len(failed),
        "invalid_count": len(invalid),
        "results": {"success": success, "failed": failed, "invalid": invalid}
    })


# ---------- NEW: Reliable RabbitMQ consumer with reconnect loop ----------
def start_consumer():
    """Run consumer persistently with automatic reconnects on CloudAMQP."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    redis = loop.run_until_complete(init_redis())

    while True:
        try:
            logger.info("🔌 Connecting to RabbitMQ...")
            params = pika.URLParameters(RABBITMQ_URL)

            # Enable SSL for CloudAMQP
            if RABBITMQ_URL.startswith("amqps://"):
                context = ssl.create_default_context()
                params.ssl_options = pika.SSLOptions(context)
                params.heartbeat = 30
                params.blocked_connection_timeout = 300

            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.basic_qos(prefetch_count=10)

            def callback(ch, method, properties, body):
                try:
                    loop.run_until_complete(process_message(redis, body))
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f" Error processing message: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
            logger.info(f" Web Push consumer started on '{QUEUE_NAME}', waiting for messages...")
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            logger.warning(f" RabbitMQ connection lost: {e}, retrying in 5 seconds...")
            time.sleep(5)
            continue

        except ssl.SSLError as e:
            logger.warning(f" SSL error with RabbitMQ: {e}, retrying in 10 seconds...")
            time.sleep(10)
            continue

        except Exception as e:
            logger.error(f" Unexpected consumer error: {e}, retrying in 5 seconds...")
            time.sleep(5)
            continue

        finally:
            try:
                if connection and connection.is_open:
                    connection.close()
                    logger.info(" Connection closed cleanly.")
            except Exception:
                pass
