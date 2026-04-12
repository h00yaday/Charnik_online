from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    ENVIRONMENT: str = "development"  # В продакшене установить "production"
    DB_ECHO: bool = True

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
