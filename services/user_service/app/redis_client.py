import os
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()
REDIS_URL = os.getenv("REDIS_URL")

redis_client = None

async def init_redis():
    global redis_client
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        await redis_client.ping()
        print(" Redis connected successfully")
    except Exception as e:
        print(" Redis connection failed:", e)
        redis_client = None
    return redis_client

# Dependency for FastAPI routes
async def get_redis():
    if redis_client is None:
        await init_redis()
    return redis_client

def get_redis_client_sync():
    """Get redis client after startup; fail fast if not initialized"""
    if redis_client is None:
        raise RuntimeError("Redis not initialized")
    return redis_client
