import pytest
from app.models import Document, DocumentCreate, SearchResult

def test_document_create():
    doc = DocumentCreate(title="Test", content="Content", user_id="user-123")
    assert doc.title == "Test"
    assert doc.content == "Content"

def test_document_fields():
    doc = Document(id="doc-1", title="Test", content="Content", user_id="user-123")
    assert doc.id == "doc-1"
    assert doc.title == "Test"
    assert doc.metadata == {}

def test_search_result():
    result = SearchResult(doc_id="doc-1", title="Test", snippet="Content...", score=0.95)
    assert result.doc_id == "doc-1"
    assert result.score == 0.95

def test_document_validation():
    doc = DocumentCreate(title="", content="Content", user_id="user-123")
    assert doc.title == ""  # Empty string is valid in this simple model

def test_search_result_score():
    result = SearchResult(doc_id="doc-1", title="Test", snippet="...", score=1.0)
    assert result.score <= 1.0
    assert result.score >= 0.0