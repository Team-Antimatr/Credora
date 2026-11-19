from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Credora API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "credora-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Neon PostgreSQL
    DATABASE_URL: str = "postgresql://neondb_owner:npg_3Mwy8uNStxsb@ep-empty-shape-atx8rqzu-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

    # Firebase
    FIREBASE_PROJECT_ID: str = "credora-a98f0"
    FIREBASE_AUTH_DOMAIN: str = "credora-a98f0.firebaseapp.com"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://credora-a98f0.firebaseapp.com",
        "https://credora-a98f0.web.app"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
