# DevOps Career Copilot

An AI-powered career automation platform for DevOps, SRE, Cloud, Platform Engineering, and FinOps professionals.

## Architecture
## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, asyncpg, Alembic |
| Database | PostgreSQL 16 |
| Automation | n8n |
| Frontend | React 18, Vite, TailwindCSS, dnd-kit |
| AI | Anthropic Claude (claude-haiku-4-5) |
| Infrastructure | Docker, Nginx |

## Services

| Service | Port | Description |
|---------|------|-------------|
| FastAPI backend | 8000 | REST API |
| React frontend | 3000 | Web UI |
| PostgreSQL | 5432 | Database |
| n8n | 5678 | Automation |
| Nginx | 80 | Reverse proxy |

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- WSL2 (Windows) or Linux/macOS

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/devops-career-copilot.git
cd devops-career-copilot
```

### 2. Configure environment
```bash
cp docker/.env.example docker/.env
# Edit docker/.env and fill in:
# - ANTHROPIC_API_KEY (get from console.anthropic.com)
# - OPENAI_API_KEY (optional, get from platform.openai.com)
# - SECRET_KEY (generate with: openssl rand -hex 32)
```

### 3. Start all services
```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 4. Start frontend dev server
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the platform
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/api/docs
- n8n automation: http://localhost:5678

## Database Schema

6 tables:
- `users` — authentication
- `candidate_profiles` — skills, experience, preferences
- `jobs` — ingested job listings
- `job_scores` — AI match scores per job/profile
- `applications` — job application tracking
- `interviews` — interview scheduling

## API Endpoints

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Jobs
- `GET /api/v1/jobs/` — list jobs (supports: search, source, min_score, remote_only, skip, limit)
- `GET /api/v1/jobs/{id}` — job detail

### Applications
- `GET /api/v1/applications/` — list applications
- `POST /api/v1/applications/` — create application
- `PATCH /api/v1/applications/{id}` — update status (drag-and-drop kanban)
- `DELETE /api/v1/applications/{id}` — delete

### Profile
- `GET /api/v1/profile/` — get profile
- `POST /api/v1/profile/` — create profile
- `PATCH /api/v1/profile/` — update profile

### Dashboard
- `GET /api/v1/dashboard/stats` — metrics (jobs today, avg score, active apps, interviews)
- `GET /api/v1/dashboard/activity` — recent activity feed

### AI Scoring
- `POST /api/v1/scoring/job/{job_id}?profile_id=` — score single job
- `POST /api/v1/scoring/batch?profile_id=&limit=` — score all unscored jobs

### Resume
- `POST /api/v1/resume/generate` — generate tailored resume + cover letter

### Ingest
- `POST /api/v1/ingest/` — ingest jobs from external sources

## Frontend Pages

| Route | Page | Status |
|-------|------|--------|
| / | Dashboard | ✅ Live |
| /jobs | Job Feed | ✅ Live |
| /applications | Application Tracker | ✅ Live |
| /resume | Resume Generator | ✅ Live (needs API credits) |
| /profile | Profile | ✅ Live |
| /analytics | Analytics | 🔄 Phase 7 |
| /settings | Settings | 🔄 Future |

## Completed Phases

- ✅ Phase 1 — Project scaffold (Docker, PostgreSQL, FastAPI, migrations)
- ✅ Phase 2 — Job ingestion pipeline (n8n workflows for RemoteOK, Indeed RSS, Wellfound)
- ✅ Phase 3 — AI job scoring via Anthropic Claude
- ✅ Phase 4 — React frontend dashboard (job feed, kanban, metrics)
- ✅ Phase 5 — Profile page (skills, experience, salary, resume text)
- ✅ Phase 6 — Resume generator (AI-tailored resume + cover letter per job)

## Remaining Phases

- 🔄 Phase 7 — Analytics page (score trends, source performance, funnel)
- 🔄 Phase 8 — Notifications (Telegram/email alerts for high matches)
- 🔄 Phase 9 — Application tracker enhancements (email detection, follow-up reminders)
- 🔄 Phase 10 — Settings page (job source config, notification preferences)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| ANTHROPIC_API_KEY | Anthropic Claude API key | Yes (for AI features) |
| OPENAI_API_KEY | OpenAI API key (alternative) | Optional |
| POSTGRES_USER | Database username | Yes |
| POSTGRES_PASSWORD | Database password | Yes |
| POSTGRES_DB | Database name | Yes |
| SECRET_KEY | JWT signing key | Yes |
| N8N_USER | n8n admin username | Yes |
| N8N_PASSWORD | n8n admin password | Yes |
| TELEGRAM_BOT_TOKEN | Telegram bot token | Optional |
| TELEGRAM_CHAT_ID | Telegram chat ID | Optional |

## Resuming Development

When returning to this project:

```bash
# 1. Start all Docker services
docker compose -f docker/docker-compose.yml up -d

# 2. Verify all containers running
docker ps

# 3. Check backend health
curl http://localhost:8000/health

# 4. Start frontend
cd frontend && npm run dev

# 5. Add API credits at console.anthropic.com
# Then update docker/.env with new key and rebuild:
docker compose -f docker/docker-compose.yml up -d --build backend
```

## Known Issues

1. **AI features require Anthropic API credits** — add credits at console.anthropic.com
2. **Job matching is generic** — ingested jobs are not filtered by DevOps keywords yet
3. **Skill gap radar is hardcoded** — needs to pull from profile skills vs job requirements
4. **Dashboard metrics show — (dash)** — requires profile_id param, currently uses mock ID

## Contributing

This is a personal career automation tool. Fork freely and adapt to your needs.
