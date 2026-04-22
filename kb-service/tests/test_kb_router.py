import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import AsyncMock, patch
import pytest_asyncio


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoints:
    @pytest.mark.asyncio
    async def test_health(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "kb-service"

    @pytest.mark.asyncio
    async def test_api_health(self, client):
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestResearchEndpoint:
    @pytest.mark.asyncio
    async def test_research_success(self, client):
        mock_results = {
            "exa": [{"title": "Test Result", "url": "http://test.com"}],
            "tavily": []
        }
        with patch('app.routers.kb.research_service.research_topic', new_callable=AsyncMock) as mock_research:
            mock_research.return_value = mock_results
            response = await client.post(
                "/api/v1/research",
                json={"query": "test query"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["query"] == "test query"
            assert "results" in data

    @pytest.mark.asyncio
    async def test_research_with_providers(self, client):
        mock_results = {"brave": [{"title": "Test"}]}
        with patch('app.routers.kb.research_service.research_topic', new_callable=AsyncMock) as mock_research:
            mock_research.return_value = mock_results
            response = await client.post(
                "/api/v1/research",
                json={"query": "test", "providers": ["brave"]}
            )
            assert response.status_code == 200
            mock_research.assert_called_once_with("test", ["brave"])

    @pytest.mark.asyncio
    async def test_research_with_empty_query(self, client):
        response = await client.post(
            "/api/v1/research",
            json={"query": ""}
        )
        assert response.status_code == 200


class TestProvidersEndpoint:
    @pytest.mark.asyncio
    async def test_list_providers(self, client):
        response = await client.get("/api/v1/providers")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        providers = data["providers"]
        assert len(providers) == 3
        provider_ids = [p["id"] for p in providers]
        assert "exa" in provider_ids
        assert "brave" in provider_ids
        assert "tavily" in provider_ids
