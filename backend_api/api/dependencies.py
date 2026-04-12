import jwt
from fastapi import HTTPException, Request, status
from fastapi.security.utils import get_authorization_scheme_param  # Добавили импорт

from core.config import settings


class CurrentUser:
    def __init__(self, id: int):
        self.id = id


async def get_current_user(request: Request) -> CurrentUser:
    token = request.cookies.get("access_token")

    if not token:
        authorization = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(authorization)
        if scheme.lower() == "bearer":
            token = param

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не авторизован",
        )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Не авторизован"
            )

        return CurrentUser(id=int(user_id))

    except jwt.ExpiredSignatureError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Срок действия токена истек",
            ) from e
    except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Не удалось проверить учетные данные",
            ) from e
