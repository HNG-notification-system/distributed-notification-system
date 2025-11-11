from fastapi import APIRouter
from app.redis_client import redis_client as redis
from ..db import engine
import datetime

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    # Contract expects { "rabbit": "ok", "redis": "ok", "uptime": "123s" }
    result = {"rabbit": "unknown", "redis": "unknown", "uptime": "0s"}

    # ping redis
    try:
        await redis.ping()
        result["redis"] = "ok"
    except Exception:
        result["redis"] = "error"

    # ping DB
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
            result["rabbit"] = "unknown"  # The rabbit is not managed here. Gateway calls Rabbit health.
    except Exception:
        result["rabbit"] = "error"

    result["uptime"] = str(datetime.datetime.utcnow())
    return result
