# Project Plan

## Overview

DevOps Career Copilot automates the job search process for DevOps professionals. It collects jobs from multiple sources, scores them against a candidate profile using AI, and tracks applications through a pipeline.

---

## Phase 1 — Foundation (Complete)

### What was built
- Docker Compose stack with 4 services: PostgreSQL 16, FastAPI backend, n8n automation, Nginx reverse proxy
- PostgreSQL schema with 6 tables: users, candidate_profiles, jobs, job_scores, applications, interviews
- 3 PostgreSQL enums: job_source, application_status, employment_type
- Indexes for fast job search (GIN index on skills array, trigram index on title)
- updated_at triggers on users, candidate_profiles, applications
- FastAPI backend with async SQLAlchemy (asyncpg driver)
- JWT authentication (register + login)
- CRUD endpoints: jobs, applications, profile, dashboard stats
- Alembic migration setup
- Dev helper script (scripts/dev.sh)

### Key files
- docker/docker-compose.yml
- database/init.sql
- backend/app/main.py
- backend/app/models/models.py

---

## Phase 2 — Job Collection Pipeline (Complete)

### What was built
- POST /api/v1/ingest/ endpoint — receives job batches from n8n
- Ingest service with upsert logic (ON CONFLICT DO UPDATE)
- Raw SQL approach using CAST(:source AS job_source) to handle PostgreSQL enums
- 3 n8n workflow JSONs: RemoteOK, Indeed RSS, Wellfound
- RemoteOK workflow: published and running daily at 06:00 UTC
- Indeed + Wellfound: published but blocked by 403 (sites block scraping)

### Key learnings
- PostgreSQL enums require explicit CAST in raw SQL inserts
- n8n shares the same PostgreSQL DB — enums must exist before workflows run
- RemoteOK API returns first item as metadata (skip items without epoch field)
- WSL paste buffer truncates heredocs — use docker exec python3 -c for file writes
- n8n item handling: iterate with .all() not items[0]

### Key files
- backend/app/api/v1/endpoints/ingest.py
- backend/app/services/ingest.py
- automation/workflows/remoteok_collector.json

---

## Phase 3 — AI Scoring Engine (Complete)

### What was built
- Scoring service (backend/app/services/scoring.py)
  - Mock scorer: calculates skill overlap between job and profile
  - Claude scorer: calls Anthropic API when ANTHROPIC_API_KEY is set
  - Auto-fallback: uses mock if API key missing or API call fails
- Score endpoint (POST /api/v1/score/)
  - Single job scoring
  - Batch scoring (scores all unscored jobs)
  - Score stats endpoint
- job_scores table populated with overall_score, ats_score, skills_match, matched_skills, skill_gaps, ai_summary

### Scoring formula (mock)
- skills_match = matched_skills / total_required_skills * 100
- overall_score = (skills_match * 0.6) + 40
- ats_score = (skills_match * 0.5) + 45

### Sample results
| Job | Company | Overall | ATS | Gaps |
|---|---|---|---|---|
| Senior DevOps Engineer | Stripe | 99.0 | 95.0 | none |
| SRE Lead | Datadog | 88.0 | 85.0 | go |
| Platform Engineer | HashiCorp | 76.0 | 75.0 | vault, nomad |

### Key learnings
- Mock user UUID must exist in users table before candidate_profiles can reference it
- SQLAlchemy returns PostgreSQL arrays as Python lists — no conversion needed
- Profile UUID must be consistent across all endpoints
- Use named parameters (:jid, :pid) not ORM insert to avoid enum casting issues

### Key files
- backend/app/services/scoring.py
- backend/app/api/v1/endpoints/score.py

---

## Phase 4 — React Frontend (Planned)

### What to build
- React 18 + Vite + TailwindCSS scaffold
- Pages: Dashboard, Jobs, Applications Pipeline, Profile, Resume Generator
- Dashboard: metrics cards, top job matches, activity feed
- Jobs page: list with AI scores, filters (remote, source, min score)
- Pipeline: kanban drag-and-drop (dnd-kit)
- Profile page: edit candidate skills and preferences
- Resume generator: generate tailored resume for a job

---

## Phase 5 — Monitoring (Planned)

- Prometheus metrics on FastAPI (/metrics endpoint)
- Grafana dashboards: pipeline health, job collection counts, scoring stats
- Uptime Kuma for service uptime monitoring

---

## Phase 6 — Notifications (Planned)

- Email alerts via SMTP when high-score jobs are found
- Telegram bot notifications
- n8n notification workflows triggered after scoring

---

## Phase 7 — Resume Generation (Planned)

- POST /api/v1/resume/generate
- Takes job_id + profile_id
- Claude generates a tailored resume in markdown
- Convert to PDF for download

---

## Infrastructure Notes

### Docker services
| Container | Image | Port |
|---|---|---|
| copilot_postgres | postgres:16-alpine | 5432 |
| copilot_backend | custom FastAPI | 8000 |
| copilot_n8n | n8nio/n8n:latest | 5678 |
| copilot_nginx | nginx:alpine | 80 |

### Starting the stack
```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
```

### Common issues and fixes
1. PostgreSQL enums not created: run CREATE TYPE manually with DO 348 BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END 348
2. WSL heredoc truncation: use docker exec python3 -c for all file writes
3. n8n 403 on Indeed/Wellfound: expected — sites block scraping
4. Profile UUID mismatch: always use the real UUID from candidate_profiles table
