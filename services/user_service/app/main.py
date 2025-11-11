from fastapi import FastAPI
from .db import Base, engine
from .redis_client import init_redis, get_redis_client_sync

from app.routes import users, status, health

app = FastAPI(title="User Service", version="1.0")

@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis
    await init_redis()
    
    # Fail fast if Redis not ready
    get_redis_client_sync()

# Include routers
app.include_router(users.router)
app.include_router(status.router)
app.include_router(health.router)
