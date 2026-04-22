from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from app.services.research import ResearchService

router = APIRouter(prefix="/api/v1", tags=["knowledge-base"])
research_service = ResearchService()


class ResearchRequest(BaseModel):
    query: str
    providers: Optional[List[str]] = None
    num_results: Optional[int] = 5


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None
    source: str


@router.post("/research", response_model=dict)
async def research(request: ResearchRequest):
    """Research a topic using available search providers"""
    results = await research_service.research_topic(
        request.query,
        request.providers
    )
    return {"query": request.query, "results": results}


@router.get("/providers")
async def list_providers():
    """List available research providers"""
    return {
        "providers": [
            {"id": "exa", "name": "Exa AI", "enabled": bool(os.getenv("EXA_API_KEY"))},
            {"id": "brave", "name": "Brave Search", "enabled": bool(os.getenv("BRAVE_API_KEY"))},
            {"id": "tavily", "name": "Tavily", "enabled": bool(os.getenv("TAVILY_API_KEY"))},
        ]
    }
