import secrets
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api import auth, characters, roller
from core.config import settings
from services.domain_exceptions import ValidationDomainError


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    yield
    await app.state.redis.aclose()


app = FastAPI(title="D&D Manager API", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(characters.router)
app.include_router(roller.router)


@app.exception_handler(ValidationDomainError)
async def validation_domain_error_handler(_: Request, exc: ValidationDomainError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


CSRF_EXEMPT_PATHS = {"/auth/login", "/auth/register", "/auth/logout"}
STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    if request.method in STATE_CHANGING_METHODS:
        path = request.url.path.rstrip("/")

        if path not in CSRF_EXEMPT_PATHS:
            access_cookie = request.cookies.get("access_token")

            if access_cookie:
                csrf_cookie = request.cookies.get("csrf_token")
                csrf_header = request.headers.get("X-CSRF-Token")

                if not csrf_cookie or not csrf_header:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF token missing"},
                    )

                if not secrets.compare_digest(csrf_cookie, csrf_header):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF token validation failed"},
                    )

    return await call_next(request)


@app.get("/")
async def root():
    return {"message": "Добро пожаловать в таверну!"}
