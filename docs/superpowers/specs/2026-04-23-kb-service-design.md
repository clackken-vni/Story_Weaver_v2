# KB Service Design Spec

**Date:** 2026-04-23
**Status:** Draft
**Author:** Brainstorming session

---

## 1. Overview

KB Service is the **internal knowledge base** module for StoryWeaver. It provides factual, verified information that AI uses as a "source of truth" when writing stories.

**Key difference from initial understanding:** KB is NOT a web search proxy. It is a curated, AI-populated knowledge store that contains verified documents organized by domain/topic.

---

## 2. Core Concepts

### 2.1 What is KB?

A Knowledge Base (KB) is a collection of **verified documents** about a specific domain (e.g., "Thời kỳ phong kiến", "Văn hóa Việt Nam", "Kiến trúc cổ"). Each KB contains:

- **Documents** with title, content, and tags
- **Trust scores** indicating verification confidence
- **Source URLs** for traceability

### 2.2 Who uses KB?

| Role | Interaction |
|------|-------------|
| **Admin** | Creates KBs, monitors AI collection jobs |
| **User** | Selects KBs for their project, proposes new KBs |
| **AI (Writer)** | Searches KB by outline keywords, uses docs as source of truth |
| **AI (Collector)** | Auto-populates KB when created, verifies information |

### 2.3 KB-Project Relationship

- 1 KB can be used by many projects
- 1 project can map to many KBs
- User manually selects KBs when creating a project

---

## 3. Data Model

### 3.1 KB Table

```sql
CREATE TABLE kb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  genres TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, populating, ready, error
  document_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Documents Table

```sql
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  trust_score FLOAT DEFAULT 0.0,
  verified BOOLEAN DEFAULT FALSE,
  source_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kb_documents_kb_id ON kb_documents(kb_id);
CREATE INDEX idx_kb_documents_tags ON kb_documents USING GIN(tags);
CREATE INDEX idx_kb_documents_verified ON kb_documents(verified);
```

### 3.3 Jobs Table

```sql
CREATE TABLE kb_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',  -- pending, searching, synthesizing, verifying, ready, error
  progress INT DEFAULT 0,
  current_step TEXT,
  total_steps INT DEFAULT 0,
  completed_steps INT DEFAULT 0,
  estimated_time TEXT,
  logs JSONB DEFAULT '[]',
  results JSONB,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kb_jobs_kb_id ON kb_jobs(kb_id);
CREATE INDEX idx_kb_jobs_status ON kb_jobs(status);
```

### 3.4 KB-Project Mapping Table

```sql
CREATE TABLE kb_project_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES kb(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kb_id, project_id)
);

CREATE INDEX idx_kb_project_mapping_project ON kb_project_mapping(project_id);
```

---

## 4. AI Collection Pipeline

When a new KB is created, AI automatically populates it through a multi-pass pipeline.

### 4.1 Pipeline Flow

```
Admin creates KB (name, description, genres)
        │
        ▼
KB status = "populating"
Job created (status: "pending")
        │
        ▼
┌─────────────────────────────────────────┐
│  PASS 1: Parallel Web Search            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Exa AI  │ │ Brave   │ │ Tavily  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘  │
│       └───────────┼───────────┘        │
│              Merge results             │
│  Job: status="searching", progress=30% │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  PASS 2: LLM Synthesis                  │
│  ├─ Read all search results             │
│  ├─ Remove duplicates                   │
│  ├─ Organize into documents             │
│  └─ Auto-generate tags                  │
│  Job: status="synthesizing", progress=60%│
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  PASS 3: Parallel Verification          │
│  For each document:                     │
│  ├─ Extract key claims                  │
│  ├─ Re-search using key claims          │
│  ├─ Compare with synthesized content    │
│  ├─ Trust >= 90% → ACCEPTED            │
│  └─ Trust < 90% → DISCARDED            │
│  Job: status="verifying", progress=80%  │
└─────────────────────────────────────────┘
        │
        ▼
Save verified documents to PostgreSQL
Update KB document_count
        │
        ▼
KB status = "ready"
Job: status="ready", progress=100%
```

### 4.2 Parallel Execution Strategy

```python
# Pass 1: Parallel search
async def search_all(query: str) -> list:
    results = await asyncio.gather(
        search_exa(query),
        search_brave(query),
        search_tavily(query),
        return_exceptions=True
    )
    return [r for r in results if not isinstance(r, Exception)]

# Pass 2: Synthesize (single LLM call)
async def synthesize(search_results: list) -> list[Document]:
    prompt = build_synthesis_prompt(search_results)
    return await llm.generate(prompt)

# Pass 3: Parallel verification
async def verify_all(documents: list[Document]) -> list[Document]:
    verified = await asyncio.gather(
        *[verify_document(doc) for doc in documents],
        return_exceptions=True
    )
    return [doc for doc in verified if doc.trust_score >= 0.9]
```

### 4.3 Trust Score Calculation

1. Extract key claims from synthesized document
2. Search each claim using web search APIs
3. Compare search results with document content
4. Calculate similarity score (0-1)
5. If score >= 0.9 → verified, else → discarded

### 4.4 Job Progress Tracking

| Phase | Progress | Status |
|-------|----------|--------|
| Start | 0% | `pending` |
| Searching | 10-30% | `searching` |
| Synthesizing | 30-60% | `synthesizing` |
| Verifying | 60-90% | `verifying` |
| Saving | 90-99% | `verifying` |
| Complete | 100% | `ready` |

---

## 5. API Endpoints

### 5.1 KB Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/kb` | Create new KB (triggers AI collection) |
| GET | `/api/v1/kb` | List all KBs |
| GET | `/api/v1/kb/:id` | Get KB details with documents |
| PATCH | `/api/v1/kb/:id` | Update KB metadata |
| DELETE | `/api/v1/kb/:id` | Delete KB and all documents |

### 5.2 Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/kb/:id/documents` | Add document manually |
| PATCH | `/api/v1/kb/:id/documents/:docId` | Update document |
| DELETE | `/api/v1/kb/:id/documents/:docId` | Delete document |

### 5.3 Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/kb/:id/search` | Search documents in KB by tags/keywords |

### 5.4 KB-Project Mapping

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kb/project/:projectId` | Get KBs mapped to project |
| POST | `/api/v1/kb/project/:projectId` | Map KBs to project |
| DELETE | `/api/v1/kb/project/:projectId/:kbId` | Unmap KB from project |

### 5.5 Job Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kb/jobs` | List all jobs |
| GET | `/api/v1/kb/jobs/:id` | Get job details (status, progress, logs) |
| GET | `/api/v1/kb/jobs/:id/stream` | Stream logs (SSE) |
| POST | `/api/v1/kb/jobs/:id/cancel` | Cancel running job |
| POST | `/api/v1/kb/jobs/:id/retry` | Retry failed job |

---

## 6. NATS Events

| Topic | Publisher | Subscriber | Payload |
|-------|-----------|------------|---------|
| `kb.created` | KB Service | KB Service (self) | `{ kb_id, name, genres[] }` |
| `kb.search` | Wizard/AI Service | KB Service | `{ kb_ids[], query, context }` |
| `kb.ready` | KB Service | Wizard Service | `{ kb_id, document_count }` |
| `kb.job.progress` | KB Service | Admin Dashboard | `{ job_id, progress, status, step }` |

---

## 7. Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Database | PostgreSQL |
| Queue | Redis (job queue + result store) |
| Event Bus | NATS |
| HTTP Client | httpx |
| LLM | Gemini/OpenAI/Anthropic (for synthesis + verification) |
| Web Search | Exa AI, Brave Search, Tavily |

---

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgres://sw_user:sw_secret@postgres:5432/storyweaver

# Redis
REDIS_URL=redis://redis:6379

# NATS
NATS_URL=nats://nats:4222

# Web Search APIs
EXA_API_KEY=xxx
BRAVE_API_KEY=xxx
TAVILY_API_KEY=xxx

# LLM (for synthesis + verification)
GEMINI_API_KEY=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
DEFAULT_PROVIDER=gemini
```

---

## 9. Error Handling

| Error | Handling |
|-------|----------|
| Web search API failure | Skip that provider, continue with others |
| LLM synthesis failure | Retry 3 times, then mark job as error |
| Trust score < 90% | Discard document, log reason |
| All providers fail | Mark job as error, notify admin |
| Database connection error | Retry with backoff |
| NATS connection error | Queue locally, retry when connected |

---

## 10. Success Criteria

- [ ] KB CRUD operations working
- [ ] Document CRUD operations working
- [ ] AI collection pipeline runs on KB creation
- [ ] Parallel search across all 3 providers
- [ ] Trust score verification >= 90%
- [ ] Job monitoring with real-time progress
- [ ] Admin dashboard shows job status/logs
- [ ] KB-Project mapping working
- [ ] Search functionality (tags + keywords)
- [ ] NATS integration for event-driven communication
