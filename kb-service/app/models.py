from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str
    content: str
    user_id: str

class Document(BaseModel):
    id: str
    title: str
    content: str
    user_id: str
    created_at: datetime = datetime.now()
    metadata: dict = {}

class SearchResult(BaseModel):
    doc_id: str
    title: str
    snippet: str
    score: float

class KBService:
    def __init__(self):
        self.documents: dict[str, Document] = {}

    def create_document(self, doc: DocumentCreate) -> Document:
        doc_id = f"doc-{len(self.documents) + 1}"
        document = Document(id=doc_id, title=doc.title, content=doc.content, user_id=doc.user_id)
        self.documents[doc_id] = document
        return document

    def get_document(self, doc_id: str) -> Optional[Document]:
        return self.documents.get(doc_id)

    def search(self, query: str) -> list[SearchResult]:
        results = []
        for doc_id, doc in self.documents.items():
            if query.lower() in doc.content.lower() or query.lower() in doc.title.lower():
                results.append(SearchResult(doc_id=doc_id, title=doc.title, snippet=doc.content[:100], score=0.9))
        return results

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            return True
        return False