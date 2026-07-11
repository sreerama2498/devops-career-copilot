"""Relevance filtering for ingested job listings.

Weighted 100-point scoring model:
    Title matching       35%
    Technology stack      35%
    Cloud provider        10%
    Infrastructure         10%
    Remote bonus            5%
    Seniority adjustment  (+/-, on top)

Jobs are stored only if the final score is >= MINIMUM_SCORE.
Reject-list titles (marketing, sales, HR, etc.) are rejected immediately,
skipping every other step.
"""
from __future__ import annotations
from dataclasses import dataclass, field

MINIMUM_SCORE = 60

# --- Step 1: Title matching (35%) ------------------------------------
# Checked in this priority order; first match wins. Longer/more specific
# phrases are listed first within a tier so e.g. "site reliability engineer"
# matches before a looser fallback would.
TITLE_REJECT = {
    "marketing", "finance", "sales", "hr", "human resources", "recruiter",
    "teacher", "nurse", "customer success", "account manager",
}

TITLE_HIGH = {"devops"}                                # +35
TITLE_VERY_HIGH = {                                    # +30
    "platform", "site reliability", "sre", "cloud", "infrastructure",
}
TITLE_MEDIUM = {                                       # +20
    "linux engineer", "build engineer", "release engineer",
    "automation engineer", "ci/cd engineer",
}
TITLE_LOW = {"system administrator", "cloud administrator", "network engineer"}  # +10

TITLE_SCORE_HIGH = 35
TITLE_SCORE_VERY_HIGH = 30
TITLE_SCORE_MEDIUM = 20
TITLE_SCORE_LOW = 10

# --- Step 2: Technology stack (35%, +3 each, capped) ------------------
TECH_STACK = {
    "aws", "azure", "docker", "terraform", "ansible", "linux",
    "kubernetes", "helm", "github actions", "jenkins", "argocd",
    "prometheus", "grafana", "python", "bash",
}
TECH_POINTS_EACH = 3
TECH_MAX = 35

# --- Step 3: Cloud provider (10%, +3 each, capped) ---------------------
CLOUD_PROVIDERS = {"aws", "azure", "gcp"}
CLOUD_POINTS_EACH = 3
CLOUD_MAX = 10

# --- Step 4: Infrastructure (10%, +3 each, capped) ----------------------
INFRA_ITEMS = {"linux", "networking", "terraform", "ansible", "kubernetes", "docker"}
INFRA_POINTS_EACH = 3
INFRA_MAX = 10

# --- Step 5: Remote bonus (5%) ------------------------------------------
REMOTE_BONUS = 5
HYBRID_BONUS = 2

# --- Step 6: Seniority adjustment ----------------------------------------
SENIORITY_LEAD = 5
SENIORITY_SENIOR = 3
SENIORITY_JUNIOR = -5


@dataclass
class RelevanceBreakdown:
    title_score: int
    tech_score: int
    cloud_score: int
    infra_score: int
    remote_score: int
    seniority_score: int
    total_score: int
    rejected: bool
    matched_title_tier: str | None = None
    matched_tech: list[str] = field(default_factory=list)
    matched_cloud: list[str] = field(default_factory=list)
    matched_infra: list[str] = field(default_factory=list)


def _score_title(title_lower: str) -> tuple[int, str | None, bool]:
    if any(kw in title_lower for kw in TITLE_REJECT):
        return 0, "reject", True
    if any(kw in title_lower for kw in TITLE_HIGH):
        return TITLE_SCORE_HIGH, "high", False
    if any(kw in title_lower for kw in TITLE_VERY_HIGH):
        return TITLE_SCORE_VERY_HIGH, "very_high", False
    if any(kw in title_lower for kw in TITLE_MEDIUM):
        return TITLE_SCORE_MEDIUM, "medium", False
    if any(kw in title_lower for kw in TITLE_LOW):
        return TITLE_SCORE_LOW, "low", False
    return 0, None, False


def _score_tech(skills_lower: list[str]) -> tuple[int, list[str]]:
    matched = [t for t in TECH_STACK if any(t in s for s in skills_lower)]
    return min(len(matched) * TECH_POINTS_EACH, TECH_MAX), matched


def _score_cloud(skills_lower: list[str]) -> tuple[int, list[str]]:
    matched = [c for c in CLOUD_PROVIDERS if any(c in s for s in skills_lower)]
    return min(len(matched) * CLOUD_POINTS_EACH, CLOUD_MAX), matched


def _score_infra(skills_lower: list[str]) -> tuple[int, list[str]]:
    matched = [i for i in INFRA_ITEMS if any(i in s for s in skills_lower)]
    return min(len(matched) * INFRA_POINTS_EACH, INFRA_MAX), matched


def _score_remote(is_remote: bool, location: str | None, description: str | None) -> int:
    if is_remote:
        return REMOTE_BONUS
    text = f"{location or ''} {description or ''}".lower()
    if "hybrid" in text:
        return HYBRID_BONUS
    return 0


def _score_seniority(title_lower: str) -> int:
    if "lead" in title_lower or "principal" in title_lower:
        return SENIORITY_LEAD
    if "senior" in title_lower or re_sr(title_lower):
        return SENIORITY_SENIOR
    if "junior" in title_lower or re_jr(title_lower):
        return SENIORITY_JUNIOR
    return 0


def re_sr(title_lower: str) -> bool:
    # Guard against false positives like matching "sr" inside another word.
    return any(w in ("sr", "sr.") for w in title_lower.replace(".", " .").split())


def re_jr(title_lower: str) -> bool:
    return any(w in ("jr", "jr.") for w in title_lower.replace(".", " .").split())


def score_job_relevance(
    title: str,
    skills: list[str] | None,
    is_remote: bool = False,
    location: str | None = None,
    description: str | None = None,
) -> RelevanceBreakdown:
    """Full structured 100-point relevance breakdown for a job posting."""
    title_lower = (title or "").lower()
    skills_lower = [s.lower() for s in (skills or [])]

    title_score, tier, rejected = _score_title(title_lower)
    if rejected:
        return RelevanceBreakdown(
            title_score=0, tech_score=0, cloud_score=0, infra_score=0,
            remote_score=0, seniority_score=0, total_score=0,
            rejected=True, matched_title_tier="reject",
        )

    tech_score, tech_hits = _score_tech(skills_lower)
    cloud_score, cloud_hits = _score_cloud(skills_lower)
    infra_score, infra_hits = _score_infra(skills_lower)
    remote_score = _score_remote(is_remote, location, description)
    seniority_score = _score_seniority(title_lower)

    total = title_score + tech_score + cloud_score + infra_score + remote_score + seniority_score
    total = max(0, min(100, total))

    return RelevanceBreakdown(
        title_score=title_score,
        tech_score=tech_score,
        cloud_score=cloud_score,
        infra_score=infra_score,
        remote_score=remote_score,
        seniority_score=seniority_score,
        total_score=total,
        rejected=False,
        matched_title_tier=tier,
        matched_tech=tech_hits,
        matched_cloud=cloud_hits,
        matched_infra=infra_hits,
    )


def calculate_relevance_score(
    title: str,
    skills: list[str] | None,
    is_remote: bool = False,
    location: str | None = None,
    description: str | None = None,
) -> int:
    """Entry point used by ingest.py. NOTE: signature now includes
    is_remote/location/description -- callers must be updated to pass
    these (previously only title/skills were accepted)."""
    return score_job_relevance(title, skills, is_remote, location, description).total_score


def should_ingest(score: int) -> bool:
    return score >= MINIMUM_SCORE
