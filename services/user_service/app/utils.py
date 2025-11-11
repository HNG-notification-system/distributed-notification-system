import os
from passlib.context import CryptContext
from dotenv import load_dotenv
import uuid
import time
from .redis_client import redis_client as redis

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
IDEMPOTENCY_TTL = int(os.getenv("IDEMPOTENCY_TTL", "3600"))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def gen_uuid() -> str:
    return str(uuid.uuid4())

# Idempotency helpers (for notifications)
async def set_idempotency_key(notification_id: str):
    key = f"idempotency:{notification_id}"
    await redis.set(key, "1", ex=IDEMPOTENCY_TTL)

async def check_idempotency(notification_id: str) -> bool:
    key = f"idempotency:{notification_id}"
    val = await redis.get(key)
    return val is not None
