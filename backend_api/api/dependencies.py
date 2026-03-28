from fastapi import Depends, HTTPException, status, Request
import jwt

from core.config import settings

class CurrentUser:
    def __init__(self, id: int):
        self.id = id

async def get_current_user(request: Request) -> CurrentUser:
    # Пытаемся достать токен из куки
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не авторизован",
        )
        
    # Убираем приставку Bearer, если она есть
    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не авторизован")
            
        # Возвращаем легкий объект без запроса к БД
        return CurrentUser(id=int(user_id))
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Срок действия токена истек")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не удалось проверить учетные данные")