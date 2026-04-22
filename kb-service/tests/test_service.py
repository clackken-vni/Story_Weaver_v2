import pytest
from app.models import KBService, DocumentCreate

@pytest.fixture
def kb():
    return KBService()

def test_create_document(kb):
    doc_create = DocumentCreate(title="Test", content="Content", user_id="user-123")
    doc = kb.create_document(doc_create)
    assert doc.id is not None
    assert doc.title == "Test"
    assert doc.content == "Content"

def test_get_document(kb):
    doc_create = DocumentCreate(title="Test", content="Content", user_id="user-123")
    created = kb.create_document(doc_create)
    found = kb.get_document(created.id)
    assert found is not None
    assert found.title == "Test"

def test_get_document_not_found(kb):
    found = kb.get_document("non-existent")
    assert found is None

def test_search(kb):
    doc_create = DocumentCreate(title="Hello World", content="Some content", user_id="user-123")
    kb.create_document(doc_create)
    results = kb.search("hello")
    assert len(results) == 1
    assert results[0].title == "Hello World"

def test_search_no_results(kb):
    results = kb.search("nonexistent")
    assert len(results) == 0

def test_delete_document(kb):
    doc_create = DocumentCreate(title="Test", content="Content", user_id="user-123")
    created = kb.create_document(doc_create)
    result = kb.delete_document(created.id)
    assert result is True
    assert kb.get_document(created.id) is None

def test_delete_document_not_found(kb):
    result = kb.delete_document("non-existent")
    assert result is False