from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    APP_NAME: str = "Paid Media Operations Platform"
    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = "postgresql+psycopg2://paidmedia:paidmedia@localhost:5432/paidmedia"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        raw = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        # Allow "*" passthrough for permissive setups
        if "*" in raw:
            return ["*"]
        return raw


@lru_cache
def get_settings() -> Settings:
    return Settings()
