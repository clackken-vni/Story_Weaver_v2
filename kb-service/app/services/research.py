import httpx
from typing import List, Dict, Any, Optional
import os


class ResearchService:
    def __init__(self):
        self.exa_api_key = os.getenv("EXA_API_KEY")
        self.brave_api_key = os.getenv("BRAVE_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")

    async def search_exa(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Exa AI"""
        if not self.exa_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.exa.ai/search",
                headers={"Authorization": f"Bearer {self.exa_api_key}"},
                json={
                    "query": query,
                    "num_results": num_results,
                    "type": "article"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def search_brave(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Brave Search"""
        if not self.brave_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/search",
                headers={"Authorization": f"Bearer {self.brave_api_key}"},
                params={"q": query, "count": num_results}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("web", {}).get("results", [])

    async def search_tavily(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Tavily"""
        if not self.tavily_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                headers={"Authorization": f"Bearer {self.tavily_api_key}"},
                json={
                    "query": query,
                    "search_depth": "basic",
                    "max_results": num_results
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def research_topic(self, query: str, providers: Optional[List[str]] = None) -> Dict[str, List]:
        """Research a topic using multiple providers"""
        if providers is None:
            providers = ["exa", "tavily"]

        results = {}
        tasks = []

        if "exa" in providers:
            tasks.append(("exa", self.search_exa(query)))
        if "tavily" in providers:
            tasks.append(("tavily", self.search_tavily(query)))
        if "brave" in providers:
            tasks.append(("brave", self.search_brave(query)))

        for name, coro in tasks:
            try:
                results[name] = await coro
            except Exception as e:
                results[name] = [{"error": str(e)}]

        return results
