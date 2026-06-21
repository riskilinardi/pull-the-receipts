from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    llm_model: str = "gpt-4o-mini"
    chroma_path: str = "./chroma"
    top_k: int = 5
    cors_origins: list[str] = ["http://localhost:3000"]
    protected_documents: list[str] = [
        "FYP-Project-Proposal.pdf",
        "NEA-Annual-Report-2023-2024.pdf",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()