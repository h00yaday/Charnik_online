from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi.concurrency import run_in_threadpool

from core.config import settings


def _get_password_hash_sync(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode("utf-8")


def _verify_password_sync(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


async def get_password_hash(password: str) -> str:
    return await run_in_threadpool(_get_password_hash_sync, password)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    return await run_in_threadpool(_verify_password_sync, plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
