import os
import httpx
from loguru import logger
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

# Base configuration

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")

if not USER_SERVICE_URL:
    raise ValueError(" USER_SERVICE_URL is not set in .env")


# Mark token invalid with retries + structured logs
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
async def mark_token_invalid(user_id: str, token: str):
    """
    Notify the User Service that a web push subscription (token) is invalid.
    Retries up to 3 times with exponential backoff on transient errors.
    """
    url = f"{USER_SERVICE_URL}/api/users/{user_id}/devices/{token}/deactivate"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.put(url)
            response.raise_for_status()
            logger.info(f" Token invalidated | user_id={user_id}, token={token[:20]}...")

        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            if 400 <= status < 500:
                # Permanent client error
                logger.warning(f" Client error ({status}) when deactivating token for user {user_id}")
            else:
                # Server-side issue (retryable)
                logger.error(f" Server error ({status}) for user {user_id} while deactivating token")
                raise
        except httpx.RequestError as e:
            # Network issues, timeouts, DNS failures — retryable
            logger.error(f" Network error while calling User Service: {e}")
            raise
        except Exception as e:
            logger.exception(f" Unexpected error marking token invalid for user {user_id}: {e}")
            raise
