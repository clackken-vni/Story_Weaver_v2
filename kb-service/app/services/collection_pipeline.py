import asyncio
import json
from typing import List, Dict, Any
from app.database import Database
from app.repositories.kb_repo import KBRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.job_repo import JobRepository
from app.services.search_providers import SearchProviders
from app.services.llm_client import LLMClient
from app.services.verification import VerificationService
from app.models.document import DocumentCreate
from app.models.job import JobCreate


class CollectionPipeline:
    def __init__(self, db: Database):
        self.db = db
        self.kb_repo = KBRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.job_repo = JobRepository(db)
        self.search = SearchProviders()
        self.llm = LLMClient()
        self.verifier = VerificationService()

    async def run(self, kb_id: str, name: str, genres: List[str]) -> None:
        job = await self.job_repo.create(JobCreate(kb_id=kb_id, total_steps=10))

        try:
            await self.kb_repo.update_status(kb_id, "populating")
            await self.job_repo.update_progress(job.id, "searching", 10, "Starting web search", 1)

            query = f"{name} {' '.join(genres)}"
            search_results = await self.search.search_all(query, num_results=20)

            await self.job_repo.update_progress(job.id, "searching", 30, f"Found {len(search_results)} results", 3)
            await self.job_repo.add_log(job.id, "info", f"Search completed: {len(search_results)} results from multiple providers")

            await self.job_repo.update_progress(job.id, "synthesizing", 40, "Synthesizing information", 4)

            synthesis_prompt = f"""Based on the following search results about "{name}", create detailed knowledge base documents.

Search Results:
{json.dumps(search_results, ensure_ascii=False, indent=2)}

Create documents in this JSON format:
[
  {{
    "title": "Document title",
    "content": "Detailed content (200-500 words)",
    "tags": ["tag1", "tag2"]
  }}
]

Create 3-8 documents covering different aspects of the topic."""

            synthesis_result = await self.llm.generate(synthesis_prompt)

            try:
                documents = json.loads(synthesis_result)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\[.*\]', synthesis_result, re.DOTALL)
                if json_match:
                    documents = json.loads(json_match.group())
                else:
                    raise ValueError("Failed to parse synthesis result")

            await self.job_repo.update_progress(job.id, "synthesizing", 60, f"Synthesized {len(documents)} documents", 6)
            await self.job_repo.add_log(job.id, "info", f"Synthesis completed: {len(documents)} documents created")

            await self.job_repo.update_progress(job.id, "verifying", 70, "Verifying documents", 7)

            verified_docs = []
            for i, doc in enumerate(documents):
                await self.job_repo.update_progress(
                    job.id, "verifying",
                    70 + (20 * i // len(documents)),
                    f"Verifying document {i+1}/{len(documents)}: {doc['title']}",
                    7 + i
                )

                is_verified, trust_score = await self.verifier.verify(doc['content'], doc['title'])

                if is_verified:
                    doc_create = DocumentCreate(
                        title=doc['title'],
                        content=doc['content'],
                        tags=doc.get('tags', []),
                        trust_score=trust_score,
                        verified=True,
                        source_urls=[]
                    )
                    created = await self.doc_repo.create(kb_id, doc_create)
                    verified_docs.append(created)
                    await self.job_repo.add_log(job.id, "info", f"Verified: {doc['title']} (trust: {trust_score:.2f})")
                else:
                    await self.job_repo.add_log(job.id, "warning", f"Discarded: {doc['title']} (trust: {trust_score:.2f})")

            await self.kb_repo.update_document_count(kb_id)

            results = {
                "docs_created": len(verified_docs),
                "docs_discarded": len(documents) - len(verified_docs),
                "avg_trust": sum(d.trust_score for d in verified_docs) / len(verified_docs) if verified_docs else 0
            }
            await self.job_repo.set_results(job.id, results)
            await self.job_repo.set_completed(job.id)

            await self.kb_repo.update_status(kb_id, "ready")

        except Exception as e:
            await self.job_repo.add_error(job.id, "pipeline", str(e))
            await self.job_repo.set_error(job.id)
            await self.kb_repo.update_status(kb_id, "error")
            raise
