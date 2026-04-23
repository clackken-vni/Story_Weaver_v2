import os
from dataclasses import dataclass


@dataclass
class Config:
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgres://sw_user:sw_secret@localhost:5432/storyweaver",
    )

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # NATS
    nats_url: str = os.getenv("NATS_URL", "nats://localhost:4222")

    # Web Search APIs
    exa_api_key: str = os.getenv("EXA_API_KEY", "")
    brave_api_key: str = os.getenv("BRAVE_API_KEY", "")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")

    # LLM
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    default_provider: str = os.getenv("DEFAULT_PROVIDER", "gemini")


config = Config()
