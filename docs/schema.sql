-- JobLens Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  level TEXT,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  status TEXT NOT NULL DEFAULT 'applied',
  job_url TEXT,
  job_description TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  linkedin_url TEXT,
  email TEXT,
  how_met TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL,
  interviewer_name TEXT,
  interviewer_title TEXT,
  scheduled_at TIMESTAMPTZ,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  topic_tag TEXT,
  what_i_said TEXT,
  what_i_should_have_said TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE offer_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  raw_text TEXT,
  s3_key TEXT,
  base_salary INTEGER,
  equity_value INTEGER,
  vesting_schedule TEXT,
  cliff_months INTEGER,
  signing_bonus INTEGER,
  start_date DATE,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE offer_clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_letter_id UUID NOT NULL REFERENCES offer_letters(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  clause_text TEXT,
  risk_level TEXT NOT NULL DEFAULT 'green',
  plain_english TEXT,
  redline_suggestion TEXT,
  is_anonymized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  s3_key TEXT,
  role_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE negotiation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_letter_id UUID NOT NULL REFERENCES offer_letters(id) ON DELETE CASCADE,
  ask_amount INTEGER,
  counter_amount INTEGER,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jd_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tech_stack TEXT[],
  seniority_signals TEXT[],
  red_flags TEXT[],
  salary_signals TEXT,
  raw_jd TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interview_rounds_application_id ON interview_rounds(application_id);
CREATE INDEX idx_offer_clauses_risk_level ON offer_clauses(risk_level);
CREATE INDEX idx_follow_ups_due_at ON follow_ups(due_at);
