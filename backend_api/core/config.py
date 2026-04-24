from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str = "redis://redis:6379/0"
    ENVIRONMENT: str = "development"  # В продакшене установить "production"
    DB_ECHO: bool = False
    TRUSTED_PROXY_IPS: str = ""

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
