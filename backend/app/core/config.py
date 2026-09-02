from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DEBUG: bool = True
    APP_NAME: str = "RazorCart AI"
    APP_VERSION: str = "0.1.0"

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/razorcart_ai"
    DATABASE_ECHO: bool = False

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    API_PREFIX: str = "/api"
    API_V1_PREFIX: str = "/api/v1"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"


settings = Settings()