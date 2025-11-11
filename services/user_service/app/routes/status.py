from fastapi import APIRouter, Depends
from ..schemas import StatusUpdate
from app.redis_client import get_redis
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["status"])

@router.post("/{notification_preference}/status/")
async def update_status(
    notification_preference: str, 
    payload: StatusUpdate,
    redis = Depends(get_redis)
):
    key = f"notif:{payload.notification_id}"
    timestamp = payload.timestamp.isoformat() if payload.timestamp else datetime.utcnow().isoformat()
    mapping = {
        "status": payload.status.value,
        "retryCount": 0,
        "lastError": payload.error or "",
        "updatedAt": timestamp
    }

    # Redis hash
  
    await redis.hset(key, mapping=mapping)
    # Set TTL for 7 days
    await redis.expire(key, 3600 * 24 * 7)

    return {
        "success": True,
        "message": f"{notification_preference} notification status updated",
        "data": mapping
    }
