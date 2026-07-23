from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    APP_NAME: str = "AlfaCareers API"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "development_secret_key_change_in_production"
    JWT_SECRET: str = "development_jwt_secret_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # PostgreSQL
    POSTGRES_USER: str = "alfacareers_user"
    POSTGRES_PASSWORD: str = "alfacareers_password"
    POSTGRES_DB: str = "alfacareers_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    # Vector DB & LLM
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8000
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"
    
    # External APIs
    SERPAPI_KEY: Optional[str] = None
    BING_SEARCH_API_KEY: Optional[str] = None
    WAMANAGER_API_KEY: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
