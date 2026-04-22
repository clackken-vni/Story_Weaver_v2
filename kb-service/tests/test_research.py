import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class MockResponse:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self._data


@pytest.fixture
def research_service():
    from app.services.research import ResearchService
    return ResearchService()


class TestResearchService:
    def test_initialization(self, research_service):
        assert research_service.exa_api_key is None
        assert research_service.brave_api_key is None
        assert research_service.tavily_api_key is None

    @pytest.mark.asyncio
    async def test_search_exa_no_api_key(self, research_service):
        result = await research_service.search_exa("test query")
        assert result == []

    @pytest.mark.asyncio
    async def test_search_brave_no_api_key(self, research_service):
        result = await research_service.search_brave("test query")
        assert result == []

    @pytest.mark.asyncio
    async def test_search_tavily_no_api_key(self, research_service):
        result = await research_service.search_tavily("test query")
        assert result == []

    @pytest.mark.asyncio
    async def test_search_exa_with_api_key(self, research_service):
        research_service.exa_api_key = "test-key"
        mock_data = {"results": [{"title": "Test", "url": "http://test.com"}]}
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.post.return_value = MockResponse(mock_data)
            mock_client.return_value = mock_instance

            result = await research_service.search_exa("test query")

            assert len(result) == 1
            assert result[0]["title"] == "Test"

    @pytest.mark.asyncio
    async def test_search_brave_with_api_key(self, research_service):
        research_service.brave_api_key = "test-key"
        mock_data = {"web": {"results": [{"title": "Test", "url": "http://test.com"}]}}
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.get.return_value = MockResponse(mock_data)
            mock_client.return_value = mock_instance

            result = await research_service.search_brave("test query")

            assert len(result) == 1

    @pytest.mark.asyncio
    async def test_search_tavily_with_api_key(self, research_service):
        research_service.tavily_api_key = "test-key"
        mock_data = {"results": [{"title": "Test", "url": "http://test.com"}]}
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.post.return_value = MockResponse(mock_data)
            mock_client.return_value = mock_instance

            result = await research_service.search_tavily("test query")

            assert len(result) == 1

    @pytest.mark.asyncio
    async def test_research_topic_default_providers(self, research_service):
        research_service.exa_api_key = "test-key"
        mock_data = {"results": [{"title": "Test", "url": "http://test.com"}]}
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.post.return_value = MockResponse(mock_data)
            mock_client.return_value = mock_instance

            result = await research_service.research_topic("test query")

            assert "exa" in result
            assert "tavily" in result
            assert "brave" not in result

    @pytest.mark.asyncio
    async def test_research_topic_specific_providers(self, research_service):
        research_service.brave_api_key = "test-key"
        mock_data = {"web": {"results": [{"title": "Test", "url": "http://test.com"}]}}
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.get.return_value = MockResponse(mock_data)
            mock_client.return_value = mock_instance

            result = await research_service.research_topic("test query", providers=["brave"])

            assert "brave" in result
            assert "exa" not in result
            assert "tavily" not in result

    @pytest.mark.asyncio
    async def test_research_topic_error_handling(self, research_service):
        research_service.exa_api_key = "test-key"
        with patch('httpx.AsyncClient') as mock_client:
            mock_instance = AsyncMock()
            mock_instance.__aenter__.return_value.post.side_effect = Exception("API Error")
            mock_client.return_value = mock_instance

            result = await research_service.research_topic("test query")

            assert "exa" in result
            assert isinstance(result["exa"], list)
            assert len(result["exa"]) == 1
            assert "error" in result["exa"][0]
