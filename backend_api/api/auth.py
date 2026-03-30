from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from db.models import User
from schemas.schemas import UserCreate, UserResponse
from core.security import get_password_hash, verify_password, create_access_token
from core.config import settings # Добавили импорт настроек

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(username=user_in.username, hashed_password=hashed_pwd)
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
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
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    # Удаляем куку при выходе
    response.delete_cookie("access_token")
    return {"message": "Успешный выход"}