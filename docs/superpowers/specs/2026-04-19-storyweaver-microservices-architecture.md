# StoryWeaver Microservices Architecture Specification

> **Created:** 2026-04-19
> **Branch:** `task/refactor-code-90y` (DO NOT MERGE WITH MAIN)
> **Status:** Draft

---

## 1. Overview

**StoryWeaver** là ứng dụng web viết truyện AI tiếng Việt với 5 bước wizard: Settings → Characters → World → Outline → Chapters.

Dự án này là **greenfield refactor** — viết lại hoàn toàn từ đầu với kiến trúc microservices, không phụ thuộc codebase cũ.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                                │
│                   AES-256-GCM Encrypted Payload                         │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────────────┐
│                     API GATEWAY (Go + Gin)                               │
│            AES Decrypt │ Auth │ Route │ Rate Limit                       │
└──────┬────────────┬───────┴──────┬───────────────┬──────────────────────┘
       │            │              │               │
       ▼            ▼              ▼               ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│   AUTH   │ │  WIZARD   │ │    AI     │ │    TTS    │
│  SERVICE  │ │  SERVICE  │ │  SERVICE  │ │  SERVICE  │
│   (Go)    │ │  (Node)   │ │  (Node)   │ │  (Node)   │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │             │
      │         ┌───▼───┐     ┌──▼──┐     ┌───▼───┐
      │         │Provider│     │Provider│    │Provider│
      │         │Interface│   │Interface│   │Interface│
      │         └───┬───┘     └──┬──┘     └───┬───┘
      │             │             │             │
      ▼             │             │             ▼
┌───────────┐       │             │      ┌───────────┐
│   NATS    │◄──────┴─────────────┴──────│   MINIO   │
│ EVENT BUS │                       │  (S3)      │
└─────┬─────┘                             └───────────┘
      │
      ├──────────────────┬──────────────────┐
      ▼                  ▼                  ▼
┌───────────┐      ┌───────────┐     ┌───────────┐
│  KB       │      │  AI       │     │  TTS      │
│  SERVICE  │      │ PROVIDERS │     │ PROVIDERS │
│ (Python)  │      │Gemini/OPAI│     │Vbee/Google│
└───────────┘      └───────────┘     │ElevenLabs │
                                    └───────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD (Next.js)                            │
│                   Completely Separate Repo/App                             │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │       ADMIN SERVICE (Go)       │
              │  User │ API Keys │ Settings   │
              └───────────────────────────────┘
```

---

## 3. Services Specification

### 3.1 API Gateway (Go + Gin)

**Responsibility:**
- Entry point cho tất cả requests
- AES-256-GCM decryption (request) / encryption (response)
- JWT validation
- Rate limiting
- Request routing đến các services

**Technology:**
- Go 1.21+
- Gin framework
- Static AES-256-GCM key (env: `API_ENCRYPTION_KEY`)

**Endpoints:**
```
POST /api/v1/auth/*          → Auth Service
POST /api/v1/wizard/*        → Wizard Service
POST /api/v1/ai/*            → AI Service
POST /api/v1/tts/*           → TTS Service
GET  /api/v1/health          → Health check
```

---

### 3.2 Auth Service (Go)

**Responsibility:**
- User registration / login
- JWT token issuance & refresh
- OAuth (Google)
- Session management

**Technology:**
- Go 1.21+
- PostgreSQL (users, sessions)
- Redis (token denylist)

**Database Schema:**
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
)
```

---

### 3.3 Wizard Service (Node.js + Fastify)

**Responsibility:**
- 5-step wizard state management
- Project CRUD
- AI generation orchestration (via NATS)

**Technology:**
- Node.js 20+
- Fastify
- PostgreSQL
- NATS

**Database Schema:**
```sql
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  current_step TEXT,
  step_data JSONB,  -- { settings, characters, world, outline, chapters }
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

generation_runs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  step TEXT,
  status TEXT,  -- pending, processing, completed, failed
  result JSONB,
  error TEXT,
  created_at TIMESTAMP
)
```

---

### 3.4 AI Service (Node.js + Fastify)

**Responsibility:**
- AI Provider abstraction layer
- Multi-provider support (Gemini, OpenAI, Anthropic)
- Prompt management
- Token estimation

**Technology:**
- Node.js 20+
- Fastify
- Redis (job queue)

**Provider Interface:**
```typescript
interface AIProvider {
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  generateJson<T>(request: JsonGenerateRequest): Promise<T>;
  stream(request: GenerateRequest): ReadableStream;
  countTokens(text: string): Promise<number>;
  getModels(): AIModel[];
  healthCheck(): Promise<boolean>;
}
```

**Implementations:**
| Provider | Package |
|----------|---------|
| Gemini | `@google/generative-ai` |
| OpenAI | `openai` |
| Anthropic | `@anthropic-ai/sdk` |

---

### 3.5 TTS Service (Node.js + Fastify)

**Responsibility:**
- TTS Provider abstraction layer
- Multi-provider support (Vbee, Google Cloud TTS, ElevenLabs)
- Audio file storage (MinIO)
- Audio processing

**Technology:**
- Node.js 20+
- Fastify
- PostgreSQL
- MinIO (S3-compatible)

**Provider Interface:**
```typescript
interface TtsProvider {
  synthesize(text: string, voice: Voice, options: TtsOptions): Promise<AudioResult>;
  getVoices(): Promise<Voice[]>;
  stream(text: string, voice: Voice): Promise<ReadableStream>;
  estimateCost(text: string): CostEstimate;
  healthCheck(): Promise<boolean>;
}
```

**Implementations:**
| Provider | Notes |
|----------|-------|
| Vbee | Primary (Vietnamese TTS) |
| Google Cloud TTS | Backup |
| ElevenLabs | Premium voices |

---

### 3.6 KB Service (Python + FastAPI)

**Responsibility:**
- Knowledge Base research
- Historical data integration
- External search APIs (Exa, Brave, Tavily)

**Technology:**
- Python 3.11+
- FastAPI
- PostgreSQL

---

### 3.7 Admin Service (Go)

**Responsibility:**
- Backend cho Admin Dashboard
- User management
- API key management
- System configuration
- Usage statistics

**Technology:**
- Go 1.21+
- PostgreSQL

---

### 3.8 Frontend (Next.js App Router)

**Responsibility:**
- User-facing application
- 5-step wizard UI
- Story writing interface

**Technology:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS v4

**Directory:** `frontend/`

---

### 3.9 Admin Dashboard (Next.js)

**Responsibility:**
- Admin UI
- User management
- System monitoring

**Technology:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS v4

**Directory:** `admin/`

**Note:** Completely separate from `frontend/` — can be deployed independently.

---

## 4. Infrastructure

### 4.1 Event Bus: NATS

**Purpose:** Async communication between services

**Topics:**
```
wizard.generate.characters    → AI Service subscribes
wizard.generate.world         → AI Service subscribes
wizard.generate.outline       → AI Service subscribes
wizard.generate.chapters      → AI Service subscribes
tts.synthesize               → TTS Service subscribes
kb.research                  → KB Service subscribes
```

### 4.2 Database: PostgreSQL + Redis

**PostgreSQL:** Persistent data (users, projects, sessions)
**Redis:** Cache, job queue, rate limiting, session store

### 4.3 Storage: MinIO

**Purpose:** Audio file storage (TTS output)

**Buckets:**
- `storyweaver-audio` — TTS audio files

### 4.4 Encryption: AES-256-GCM

**Purpose:** Encrypt API payloads between FE/Admin and API Gateway

**Implementation:**
- Static key in environment variable
- Each request includes IV (Initialization Vector)
- Response encrypted with same approach

**Request Format:**
```json
{
  "encrypted": "base64(AES-256-GCM(plaintext))",
  "iv": "base64(random_16_bytes)"
}
```

---

## 5. Security

| Concern | Solution |
|---------|----------|
| API Payload | AES-256-GCM encryption |
| Authentication | JWT with refresh tokens |
| Token Storage | Redis denylist for revoke |
| Rate Limiting | Per-user, per-endpoint limits |
| CORS | Configured per environment |
| API Keys | Server-side only, env variables |

---

## 6. Directory Structure

```
storyweaver/
├── api-gateway/              # Go + Gin
│   ├── cmd/
│   ├── internal/
│   │   ├── gateway/
│   │   ├── middleware/
│   │   └── crypto/
│   └── pkg/
│
├── auth-service/             # Go
│   ├── cmd/
│   ├── internal/
│   │   ├── auth/
│   │   ├── handler/
│   │   └── repository/
│   └── pkg/
│
├── wizard-service/           # Node.js + Fastify
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── providers/       # AI Provider interface
│   │   └── db/
│   └── package.json
│
├── ai-service/               # Node.js + Fastify
│   ├── src/
│   │   ├── providers/      # Gemini, OpenAI, Anthropic
│   │   ├── services/
│   │   └── queue/
│   └── package.json
│
├── tts-service/              # Node.js + Fastify
│   ├── src/
│   │   ├── providers/      # Vbee, Google, ElevenLabs
│   │   ├── services/
│   │   └── storage/
│   └── package.json
│
├── kb-service/               # Python + FastAPI
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   └── models/
│   └── requirements.txt
│
├── admin-service/            # Go
│   ├── cmd/
│   ├── internal/
│   │   ├── admin/
│   │   ├── handler/
│   │   └── repository/
│   └── pkg/
│
├── frontend/                 # Next.js (User UI)
│   ├── app/
│   │   └── (user)/         # Route group
│   ├── components/
│   └── package.json
│
├── admin/                    # Next.js (Admin Dashboard)
│   ├── app/
│   │   └── admin/          # Route group
│   ├── components/
│   └── package.json
│
├── nats/                     # NATS config
│   └── nats-server.conf
│
├── docker-compose/           # Dev environment
│   ├── docker-compose.yml
│   └── services/
│
├── kubernetes/               # Production deployment
│
└── docs/
    └── superpowers/
        └── specs/           # Design specs
```

---

## 7. Deployment

### Development: Docker Compose

```bash
docker-compose -f docker-compose/dev.yml up
```

**Services:** PostgreSQL, Redis, NATS, MinIO, all microservices

### Production: Kubernetes

- Helm charts for each service
- Horizontal Pod Autoscaling
- Rolling deployments

### Serverless (Optional)

- Vercel for Frontend
- Railway/Fly.io for microservices

---

## 8. Observability

**Stack:** OpenTelemetry + APM (Datadog/New Relic/Grafana Cloud)

**Components:**
- Distributed tracing
- Structured logging (Loki)
- Metrics (Prometheus + Grafana)
- APM for performance monitoring

---

## 9. Tech Stack Summary

| Component | Technology |
|-----------|------------|
| API Gateway | Go + Gin |
| Auth Service | Go |
| Wizard Service | Node.js + Fastify |
| AI Service | Node.js + Fastify |
| TTS Service | Node.js + Fastify |
| KB Service | Python + FastAPI |
| Admin Service | Go |
| Frontend | Next.js 14+ (App Router) |
| Admin Dashboard | Next.js 14+ (App Router) |
| Database | PostgreSQL |
| Cache/Queue | Redis |
| Event Bus | NATS |
| Storage | MinIO (S3) |
| Encryption | AES-256-GCM |
| Deployment | Docker Compose + Kubernetes |
| Observability | OpenTelemetry + APM |

---

## 10. Decisions Made

| Decision | Choice |
|----------|--------|
| Architecture | Full microservices (greenfield) |
| API Encryption | AES-256-GCM + Static Key |
| Event Bus | NATS |
| Frontend | Next.js (separate from Admin) |
| Admin | Next.js (separate from Frontend) |
| AI Providers | Provider Interface (Gemini/OpenAI/Anthropic) |
| TTS Providers | Provider Interface (Vbee/Google/ElevenLabs) |
| Deployment | Docker Compose (dev) + K8s (prod) |
| Observability | OpenTelemetry + APM |

---

## 11. Next Steps

1. ~~Analyze codebase (done)~~
2. ~~Design architecture (done)~~
3. Write SPEC.md (this document)
4. Create implementation plan
5. Implement services one by one

---

*This spec is the source of truth for the StoryWeaver microservices refactor.*
