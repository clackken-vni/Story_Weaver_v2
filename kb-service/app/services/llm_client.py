import httpx
from typing import List, Dict, Any
from app.config import config


class LLMClient:
    def __init__(self):
        self.provider = config.default_provider
        self.gemini_key = config.gemini_api_key
        self.openai_key = config.openai_api_key
        self.anthropic_key = config.anthropic_api_key

    async def generate(self, prompt: str, max_tokens: int = 4096) -> str:
        if self.provider == "gemini" and self.gemini_key:
            return await self._generate_gemini(prompt, max_tokens)
        elif self.provider == "openai" and self.openai_key:
            return await self._generate_openai(prompt, max_tokens)
        elif self.provider == "anthropic" and self.anthropic_key:
            return await self._generate_anthropic(prompt, max_tokens)
        else:
            raise ValueError(f"No API key for provider: {self.provider}")

    async def _generate_gemini(self, prompt: str, max_tokens: int) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _generate_openai(self, prompt: str, max_tokens: int) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}"},
                json={
                    "model": "gpt-4",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _generate_anthropic(self, prompt: str, max_tokens: int) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
