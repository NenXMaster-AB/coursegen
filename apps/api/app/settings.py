from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="COURSEGEN_", env_file=".env", extra="ignore")

    db_url: str = "sqlite:////data/coursegen.db"
    redis_url: str = "redis://redis:6379/0"

    llm_provider: str = "openai"  # openai|ollama
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.1:8b"

settings = Settings()
