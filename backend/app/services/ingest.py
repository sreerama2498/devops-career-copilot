from __future__ import annotations
import logging, uuid
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.job_filter import (
    calculate_relevance_score,
    score_job_relevance,
    should_ingest,
)
logger = logging.getLogger(__name__)
def _parse_dt(v):
    if not v: return None
    if isinstance(v, datetime): return v
    try: return datetime.fromisoformat(str(v).replace('Z','+00:00'))
    except: return None
def _n(r):
    s = r.get('salary', {})
    sm = r.get('salary_min') or (s.get('min') if isinstance(s, dict) else None)
    sx = r.get('salary_max') or (s.get('max') if isinstance(s, dict) else None)
    return {
        'ext_id':   str(r.get('external_id') or r.get('id') or uuid.uuid4()),
        'source':   r.get('source', 'other'),
        'title':    (r.get('title') or r.get('position') or '')[:500],
        'company':  (r.get('company') or r.get('company_name') or 'Unknown')[:300],
        'location': r.get('location') or None,
        'remote':   bool(r.get('is_remote') or r.get('remote') or False),
        'emp':      r.get('employment_type') or None,
        'sal_min':  int(sm) if sm else None,
        'sal_max':  int(sx) if sx else None,
        'currency': r.get('currency') or 'USD',
        'desc':     r.get('description') or r.get('text') or None,
        'skills':   list(r.get('required_skills') or r.get('tags') or []),
        'url':      r.get('url') or r.get('apply_url') or '',
        'posted':   _parse_dt(r.get('posted_at') or r.get('date')),
        'now':      datetime.now(timezone.utc),
    }
Q = text("""
    INSERT INTO jobs (
        external_id, source, title, company, location, is_remote,
        employment_type, salary_min, salary_max, currency,
        description, required_skills, url, posted_at, collected_at, is_active
    ) VALUES (
        :ext_id,
        :source ::job_source,
        :title, :company, :location, :remote,
        :emp ::employment_type,
        :sal_min, :sal_max, :currency, :desc,
        :skills ::text[],
        :url, :posted, :now, true
    )
    ON CONFLICT (source, external_id) DO UPDATE SET
        title           = EXCLUDED.title,
        company         = EXCLUDED.company,
        location        = EXCLUDED.location,
        is_remote       = EXCLUDED.is_remote,
        salary_min      = EXCLUDED.salary_min,
        salary_max      = EXCLUDED.salary_max,
        description     = EXCLUDED.description,
        required_skills = EXCLUDED.required_skills,
        is_active       = true,
        collected_at    = EXCLUDED.collected_at
""")
async def ingest_jobs(db, raw_jobs):
    received, inserted, skipped = len(raw_jobs), 0, 0
    for r in raw_jobs:
        try:
            p = _n(r)

            breakdown = score_job_relevance(
                title=p["title"],
                skills=p["skills"],
                is_remote=p["remote"],
                location=p["location"],
                description=p["desc"],
            )

            print("=" * 70)
            print(f"TITLE      : {p['title']}")
            print(f"TITLE      : {breakdown.title_score}")
            print(f"TECH       : {breakdown.tech_score}")
            print(f"CLOUD      : {breakdown.cloud_score}")
            print(f"INFRA      : {breakdown.infra_score}")
            print(f"REMOTE     : {breakdown.remote_score}")
            print(f"SENIORITY  : {breakdown.seniority_score}")
            print(f"TOTAL      : {breakdown.total_score}")
            print("=" * 70)

            score = breakdown.total_score

            if not should_ingest(score):
                skipped += 1
                continue
            if not p['url']:
                skipped += 1
                continue
            await db.execute(Q, p)
            await db.commit()
            inserted += 1
        except Exception as e:
            await db.rollback()
            logger.warning('Skip: %s', e)
            skipped += 1
    return {'received': received, 'inserted': inserted, 'skipped': skipped}
