import os
import json
import asyncio
from pywebpush import webpush, WebPushException
from loguru import logger
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

# Load environment variables

load_dotenv()

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_EMAIL = os.getenv("VAPID_EMAIL")

if not all([VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_EMAIL]):
    raise ValueError(" Missing VAPID configuration in .env (need VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_EMAIL)")

# Web Push send logic (async)
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
async def send_webpush_message(subscription: dict, title: str, body: str, data: dict = None):
    """
    Sends a Web Push notification using VAPID keys.

    subscription: dict like {
        "endpoint": "https://fcm.googleapis.com/fcm/send/...",
        "keys": { "p256dh": "...", "auth": "..." }
    }
    """
    loop = asyncio.get_running_loop()
    payload = json.dumps({
        "title": title,
        "body": body,
        "data": data or {}
    })

    try:
        response = await loop.run_in_executor(
            None,
            lambda: webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"}
            )
        )
        logger.info(f" Web push sent to {subscription.get('endpoint')[:30]}... ({response.status_code})")
        return response.status_code

    except WebPushException as e:
        logger.error(f" Web push failed for {subscription.get('endpoint')[:30]}...: {e}")
        raise
