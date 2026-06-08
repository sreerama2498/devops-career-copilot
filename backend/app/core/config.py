from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "DevOps Career Copilot"
    environment: str = "development"
    log_level: str = "info"
    database_url: str = "postgresql+asyncpg://copilot:copilot_secret@localhost:5432/devops_copilot"
    secret_key: str = "change_me_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5"
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    ingest_token: str = ""

@lru_cache
def get_settings() -> Settings:
    return Settings()
