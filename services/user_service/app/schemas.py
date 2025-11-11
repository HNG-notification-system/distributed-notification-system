from pydantic import BaseModel, Field, EmailStr, constr
from typing import Optional, List, Dict
from enum import Enum
from datetime import datetime

# ---------------------------
# User Preferences Schema
# ---------------------------
class UserPreference(BaseModel):
    email: bool = True
    push: bool = False

# ---------------------------
# User Creation Request
# ---------------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    push_token: Optional[str] = None
    preferences: UserPreference
    password: constr(min_length=8)  # enforces strong password in schema

# ---------------------------
# User Response Schema
# ---------------------------
class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    push_tokens: List[str] = []
    preferences: Dict[str, bool]

    model_config = {"from_attributes": True}  # Pydantic v2 equivalent of orm_mode

# ---------------------------
# Device Registration
# ---------------------------
class DeviceCreate(BaseModel):
    device_token: str
    platform: Optional[str] = "unknown"

# ---------------------------
# Preference Update
# ---------------------------
class PreferenceUpdate(BaseModel):
    channel: constr(pattern="^(email|push)$")  # Pydantic v2: use pattern instead of regex
    enabled: bool
    quiet_hours_start: Optional[str] = Field(
        default=None, pattern=r'^\d{2}:\d{2}$', description="24-hour format HH:MM"
    )
    quiet_hours_end: Optional[str] = Field(
        default=None, pattern=r'^\d{2}:\d{2}$', description="24-hour format HH:MM"
    )

# ---------------------------
# Notification Status Enum
# ---------------------------
class NotificationStatus(str, Enum):
    delivered = "delivered"
    pending = "pending"
    failed = "failed"

# ---------------------------
# Notification Status Update
# ---------------------------
class StatusUpdate(BaseModel):
    notification_id: str
    status: NotificationStatus
    timestamp: Optional[datetime] = None
    error: Optional[str] = None
