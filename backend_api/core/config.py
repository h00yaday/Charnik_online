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

    CELERY_BROKER_URL: str = "amqp://guest:guest@rabbitmq:5672//"

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Charnik Online"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
