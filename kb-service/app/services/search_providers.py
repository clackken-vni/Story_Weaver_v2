import asyncio
import httpx
from typing import List, Dict, Any
from app.config import config


class SearchProviders:
    def __init__(self):
        self.exa_key = config.exa_api_key
        self.brave_key = config.brave_api_key
        self.tavily_key = config.tavily_api_key

    async def search_all(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        tasks = []

        if self.exa_key:
            tasks.append(self.search_exa(query, num_results))
        if self.brave_key:
            tasks.append(self.search_brave(query, num_results))
        if self.tavily_key:
            tasks.append(self.search_tavily(query, num_results))

        if not tasks:
            return []

        results = await asyncio.gather(*tasks, return_exceptions=True)

        merged = []
        for result in results:
            if isinstance(result, Exception):
                continue
            if isinstance(result, list):
                merged.extend(result)

        return merged

    async def search_exa(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.exa.ai/search",
                headers={"Authorization": f"Bearer {self.exa_key}"},
                json={"query": query, "numResults": num_results}
            )
            response.raise_for_status()
            data = response.json()
            return [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("text", ""), "provider": "exa"}
                for r in data.get("results", [])
            ]

    async def search_brave(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/search",
                headers={"X-Subscription-Token": self.brave_key},
                params={"q": query, "count": num_results}
            )
            response.raise_for_status()
            data = response.json()
            return [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("description", ""), "provider": "brave"}
                for r in data.get("web", {}).get("results", [])
            ]

    async def search_tavily(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={"api_key": self.tavily_key, "query": query, "max_results": num_results}
            )
            response.raise_for_status()
            data = response.json()
            return [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", ""), "provider": "tavily"}
                for r in data.get("results", [])
            ]
