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
    
    # CORS configuration: comma-separated list of allowed origins
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:3000,http://localhost:5173,http://localhost:8000"
    
    CELERY_BROKER_URL: str = "amqp://guest:guest@rabbitmq:5672//"
    
    # Celery retry configuration
    CELERY_TASK_MAX_RETRIES: int = 3
    CELERY_TASK_DEFAULT_RETRY_DELAY: int = 60  # 60 seconds

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Charnik Online"

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        """Преобразует строку origins в список"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
