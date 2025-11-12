import os
from redis.asyncio import Redis
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# Singleton Redis Client

redis_client: Redis | None = None


async def init_redis() -> Redis:
    """
    Initialize a Redis connection (singleton).
    Ensures only one connection per service instance.
    """
    global redis_client

    if redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

        # Create the Redis client
        redis_client = Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5,
            health_check_interval=30,
        )

        try:
            pong = await redis_client.ping()
            if pong:
                logger.info(f" Connected to Redis at {redis_url}")
        except Exception as e:
            logger.error(f" Redis connection failed: {e}")
            redis_client = None  # Reset on failure
            raise

    return redis_client


async def close_redis():
    """
    Gracefully close Redis connection when shutting down.
    """
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
            logger.info(" Redis connection closed cleanly")
        except Exception as e:
            logger.warning(f" Failed to close Redis connection: {e}")
        finally:
            redis_client = None
