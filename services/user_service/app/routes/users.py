import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..db import get_db
from ..models import User, Device, NotificationPreference
from ..schemas import UserCreate, UserResponse, DeviceCreate, PreferenceUpdate
from ..utils import hash_password
from app.redis_client import redis_client as redis

router = APIRouter(prefix="/api/v1/users", tags=["users"])

# logger Configuration
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@router.post("/", status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = User(
            name=payload.name,
            email=payload.email,
            password=hash_password(payload.password)
        )
        db.add(user)
        await db.flush()  # to populate user.id

        # Saves device if push_token provided
        if payload.push_token:
            device = Device(
                user_id=user.id,
                device_token=payload.push_token,
                platform="unknown"
            )
            db.add(device)

        # Saves preferences (email and push)
        db.add_all([
            NotificationPreference(user_id=user.id, channel='email', enabled=payload.preferences.email),
            NotificationPreference(user_id=user.id, channel='push', enabled=payload.preferences.push)
        ])
        await db.commit()
        await db.refresh(user)

        # Build response
        push_tokens = [payload.push_token] if payload.push_token else []
        response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "push_tokens": push_tokens,
            "preferences": {"email": payload.preferences.email, "push": payload.preferences.push}
        }

        # Cache user safely
        if redis:
            try:
                await redis.setex(f"user:{user.id}", 300, json.dumps(response))
            except Exception as e:
                logger.warning("Redis cache set failed: %s", e)

        return {
            "success": True,
            "data": response,
            "error": None,
            "message": "User created successfully",
            "meta": None
        }

    except IntegrityError:
        await db.rollback()
        logger.warning("User creation failed - duplicate email: %s", payload.email)
        raise HTTPException(status_code=409, detail="user_exists")
    except Exception as e:
        await db.rollback()
        logger.exception("Create user failed")
        raise HTTPException(status_code=500, detail="internal_error")


@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    # Attempts to fetch from Redis cache first
    if redis:
        try:
            cached = await redis.get(f"user:{user_id}")
            if cached:
                response_data = json.loads(cached)
                return {
                    "success": True,
                    "data": response_data,
                    "error": None,
                    "message": "User retrieved from cache",
                    "meta": None
                }
        except Exception as e:
            logger.warning("Redis cache fetch failed: %s", e)

    # Fetch from DB if not cached
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")

    # Get active device tokens
    result = await db.execute(select(Device).where(Device.user_id == user_id, Device.is_active == True))
    devices = result.scalars().all()
    push_tokens = [d.device_token for d in devices]

    # Get preferences
    result = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == user_id))
    prefs = result.scalars().all()
    pref_map = {p.channel: p.enabled for p in prefs}

    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "push_tokens": push_tokens,
        "preferences": {"email": pref_map.get("email", True), "push": pref_map.get("push", True)}
    }

    # Cache safely
    if redis:
        try:
            await redis.setex(f"user:{user.id}", 300, json.dumps(response))
        except Exception as e:
            logger.warning("Redis cache set failed: %s", e)

    return {
        "success": True,
        "data": response,
        "error": None,
        "message": "User retrieved successfully",
        "meta": None
    }


@router.put("/{user_id}/preferences")
async def update_preferences(user_id: str, body: PreferenceUpdate, db: AsyncSession = Depends(get_db)):
    try:
        # Upsert preference
        result = await db.execute(
            select(NotificationPreference)
            .where(NotificationPreference.user_id == user_id, NotificationPreference.channel == body.channel)
        )
        pref = result.scalars().first()
        if pref:
            pref.enabled = body.enabled
            pref.quiet_hours_start = body.quiet_hours_start
            pref.quiet_hours_end = body.quiet_hours_end
        else:
            pref = NotificationPreference(
                user_id=user_id,
                channel=body.channel,
                enabled=body.enabled,
                quiet_hours_start=body.quiet_hours_start,
                quiet_hours_end=body.quiet_hours_end
            )
            db.add(pref)
        await db.commit()

        # Invalidate cache safely
        if redis:
            try:
                await redis.delete(f"user:{user_id}")
            except Exception as e:
                logger.warning("Redis cache delete failed: %s", e)

        return {
            "success": True,
            "data": {"channel": body.channel, "enabled": body.enabled},
            "message": "Preferences updated successfully",
            "error": None,
            "meta": None
        }
    except Exception as e:
        await db.rollback()
        logger.exception("Update preferences failed")
        raise HTTPException(status_code=500, detail="internal_error")


@router.post("/{user_id}/devices", status_code=201)
async def register_device(user_id: str, body: DeviceCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Deactivate any existing device with the same token
        await db.execute(
            text("UPDATE devices SET is_active = FALSE WHERE device_token = :token"),
            {"token": body.device_token}
        )

        # Register new device
        device = Device(
            user_id=user_id,
            device_token=body.device_token,
            platform=body.platform or "unknown",
            is_active=True
        )
        db.add(device)
        await db.commit()

        # Invalidate Redis cache (optional, safe)
        if redis:
            try:
                await redis.delete(f"user:{user_id}")
            except Exception as e:
                logger.warning("Redis cache delete failed: %s", e)

        response = {
            "success": True,
            "data": {"device_token": body.device_token},
            "message": "Device registered successfully",
            "error": None,
            "meta": None
        }

        # Log response for debugging
        logger.info("Device registered: %s", json.dumps(response, indent=2))

        return response

    except Exception as e:
        await db.rollback()
        logger.exception("Register device failed: %s", e)
        raise HTTPException(status_code=500, detail="internal_error")
