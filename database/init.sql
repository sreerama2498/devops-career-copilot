CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE job_source AS ENUM ('linkedin','indeed','remoteok','wellfound','company_portal','other');
CREATE TYPE application_status AS ENUM ('saved','applied','screening','interview','offer','rejected','withdrawn');
CREATE TYPE employment_type AS ENUM ('full_time','part_time','contract','freelance');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  full_name       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT, years_experience INTEGER, location TEXT,
  remote_preference TEXT, skills TEXT[] NOT NULL DEFAULT '{}',
  resume_text TEXT, resume_url TEXT, salary_min INTEGER, salary_max INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id     TEXT,
  source          job_source NOT NULL,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  location        TEXT, is_remote BOOLEAN DEFAULT FALSE,
  employment_type employment_type,
  salary_min INTEGER, salary_max INTEGER, currency TEXT DEFAULT 'USD',
  description TEXT, required_skills TEXT[] NOT NULL DEFAULT '{}',
  url TEXT NOT NULL, posted_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (source, external_id)
);

CREATE INDEX idx_jobs_source       ON jobs(source);
CREATE INDEX idx_jobs_collected_at ON jobs(collected_at DESC);
CREATE INDEX idx_jobs_title_trgm   ON jobs USING gin(title gin_trgm_ops);
CREATE INDEX idx_jobs_skills       ON jobs USING gin(required_skills);

CREATE TABLE job_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2), ats_score NUMERIC(5,2), skills_match NUMERIC(5,2),
  skill_gaps TEXT[] NOT NULL DEFAULT '{}', matched_skills TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT, scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, profile_id)
);

CREATE INDEX idx_scores_profile ON job_scores(profile_id, overall_score DESC);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id),
  status application_status NOT NULL DEFAULT 'saved',
  applied_at TIMESTAMPTZ, resume_used TEXT, cover_letter TEXT,
  notes TEXT, follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX idx_applications_user   ON applications(user_id, status);
CREATE INDEX idx_applications_status ON applications(status);

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1, interview_type TEXT,
  scheduled_at TIMESTAMPTZ, interviewer_name TEXT,
  interviewer_role TEXT, notes TEXT, outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
