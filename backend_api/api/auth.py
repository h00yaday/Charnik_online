from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.limiter import RateLimiter
from core.security import create_access_token, get_password_hash, verify_password
from db.database import get_db
from db.models import User
from schemas.schemas import UserCreate, UserLogin, UserResponse
from services.character_service import CharacterService

login_limiter = RateLimiter(capacity=5, refill_amount=1, refill_period_ms=10000)
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(login_limiter)],
)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):

    await CharacterService.ensure_username_available(db, user_in.username)
    email_check_result = await db.execute(select(User).where(User.email == user_in.email))
    if email_check_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400, 
            detail="Пользователь с таким email уже существует"
        )
    
    hashed_pwd = await get_password_hash(user_in.password)
    
    new_user = User(
        username=user_in.username,
        hashed_password=hashed_pwd,
        email=user_in.email
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", dependencies=[Depends(login_limiter)])
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_login = UserLogin(username=form_data.username, password=form_data.password)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = await db.execute(select(User).where(User.username == user_login.username))
    user = result.scalar_one_or_none()

    if not user or not await verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    is_secure = settings.ENVIRONMENT == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    csrf_token = CharacterService.issue_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=is_secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"access_token": access_token, "token_type": "bearer", "csrf_token": csrf_token}


@router.post("/logout")
async def logout(response: Response):
    # Удаляем куку при выходе
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return {"message": "Успешный выход"}
