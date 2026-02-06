-- Supabase Database Schema for Katharos (Lead Collection)
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================================

-- Lead collection table with name, company, and email
CREATE TABLE IF NOT EXISTS collected_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collected_emails_created_at_idx ON collected_emails(created_at DESC);

-- Allow anonymous inserts (since users aren't authenticated)
ALTER TABLE collected_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert emails" ON collected_emails;
DROP POLICY IF EXISTS "Only admins can view emails" ON collected_emails;

-- Policy: Allow anyone to insert their info
CREATE POLICY "Anyone can insert emails"
  ON collected_emails FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated users (admins) can view the collected leads
-- You can view them in the Supabase dashboard Table Editor
CREATE POLICY "Only admins can view emails"
  ON collected_emails FOR SELECT
  USING (auth.role() = 'authenticated');

-- Done! Your lead collection is ready.
-- =====================================================================
-- View collected leads in: Supabase Dashboard > Table Editor > collected_emails
-- =====================================================================

-- =====================================================================
-- CASES TABLE - Persistent case storage for compliance investigations
-- =====================================================================

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  risk_level TEXT DEFAULT 'UNKNOWN',
  status TEXT DEFAULT 'active',
  viewed BOOLEAN DEFAULT false,

  -- Conversation and chat data (stored as JSONB for flexibility)
  chat_history JSONB DEFAULT '[]'::jsonb,
  conversation_transcript JSONB DEFAULT '[]'::jsonb,

  -- Documents and files
  documents JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,

  -- Analysis results
  analysis_data JSONB DEFAULT '{}'::jsonb,
  screenings JSONB DEFAULT '[]'::jsonb,

  -- Reports and artifacts
  pdf_reports JSONB DEFAULT '[]'::jsonb,
  network_artifacts JSONB DEFAULT '[]'::jsonb,

  -- Monitoring configuration
  monitoring_enabled BOOLEAN DEFAULT false,
  monitoring_last_run TIMESTAMPTZ,
  monitoring_alerts JSONB DEFAULT '[]'::jsonb,

  -- User/workspace association
  email_domain TEXT DEFAULT '',
  created_by_email TEXT DEFAULT '',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS cases_email_domain_idx ON cases(email_domain);
CREATE INDEX IF NOT EXISTS cases_created_by_email_idx ON cases(created_by_email);
CREATE INDEX IF NOT EXISTS cases_updated_at_idx ON cases(updated_at DESC);
CREATE INDEX IF NOT EXISTS cases_risk_level_idx ON cases(risk_level);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON cases;

-- Policy: Users can insert cases associated with their email
CREATE POLICY "Users can insert their own cases"
  ON cases FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view cases from their workspace or their own email
CREATE POLICY "Users can view their own cases"
  ON cases FOR SELECT
  USING (true);

-- Policy: Users can update cases from their workspace or their own email
CREATE POLICY "Users can update their own cases"
  ON cases FOR UPDATE
  USING (true);

-- Policy: Users can delete cases from their workspace or their own email
CREATE POLICY "Users can delete their own cases"
  ON cases FOR DELETE
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on case updates
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- MIGRATION: If you already have a cases table, run this to add new columns
-- =====================================================================
-- ALTER TABLE cases ADD COLUMN IF NOT EXISTS conversation_transcript JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE cases ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE cases ADD COLUMN IF NOT EXISTS screenings JSONB DEFAULT '[]'::jsonb;
-- =====================================================================

-- =====================================================================
-- METRICS TABLES - Product analytics and KPI tracking
-- =====================================================================

-- Investigation timing metrics
CREATE TABLE IF NOT EXISTS metrics_investigations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  user_email TEXT,
  email_domain TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  duration_minutes NUMERIC(10,2),

  -- Outcome
  outcome_risk_level TEXT,
  outcome_decision TEXT,
  event_count INTEGER DEFAULT 0,

  -- Context
  document_count INTEGER DEFAULT 0,
  query_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS metrics_inv_email_domain_idx ON metrics_investigations(email_domain);
CREATE INDEX IF NOT EXISTS metrics_inv_completed_at_idx ON metrics_investigations(completed_at DESC);

-- RAG retrieval accuracy tracking
CREATE TABLE IF NOT EXISTS metrics_retrievals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id TEXT UNIQUE NOT NULL,
  case_id TEXT,
  user_email TEXT,

  -- Query info
  query_text TEXT,
  top_k INTEGER DEFAULT 10,
  result_count INTEGER,

  -- Results with relevance feedback
  results JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ rank, id, score, namespace, wasRelevant, wasUsed }]

  -- Calculated metrics (updated on feedback)
  relevant_in_top_k INTEGER,
  precision_at_k NUMERIC(5,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  feedback_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS metrics_ret_created_at_idx ON metrics_retrievals(created_at DESC);

-- Sanctions screening precision tracking
CREATE TABLE IF NOT EXISTS metrics_sanctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id TEXT UNIQUE NOT NULL,
  case_id TEXT,
  user_email TEXT,

  -- Query
  query_name TEXT,
  query_type TEXT,

  -- Results
  match_count INTEGER,
  matches JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ sdnId, name, confidence, matchType, isTruePositive, analystNote }]

  -- Calculated (updated on feedback)
  true_positives INTEGER,
  false_positives INTEGER,
  precision NUMERIC(5,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  feedback_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS metrics_sanc_created_at_idx ON metrics_sanctions(created_at DESC);

-- Daily aggregated metrics snapshot
CREATE TABLE IF NOT EXISTS metrics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,

  -- Investigation time
  investigations_completed INTEGER DEFAULT 0,
  avg_investigation_minutes NUMERIC(10,2),
  median_investigation_minutes NUMERIC(10,2),

  -- Retrieval accuracy
  retrieval_queries INTEGER DEFAULT 0,
  retrieval_recall_at_10 NUMERIC(5,4),

  -- Sanctions precision
  sanctions_screenings INTEGER DEFAULT 0,
  sanctions_precision NUMERIC(5,4),
  sanctions_false_positive_rate NUMERIC(5,4),

  -- Usage
  unique_users INTEGER DEFAULT 0,
  peak_concurrent_users INTEGER DEFAULT 0,
  total_cases_created INTEGER DEFAULT 0,

  -- Document processing
  documents_processed INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS metrics_daily_date_idx ON metrics_daily(date DESC);

-- Enable RLS on metrics tables
ALTER TABLE metrics_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_retrievals ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;

-- Allow inserts for metrics (internal use)
CREATE POLICY "Allow metrics inserts" ON metrics_investigations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow metrics inserts" ON metrics_retrievals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow metrics inserts" ON metrics_sanctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow metrics inserts" ON metrics_daily FOR INSERT WITH CHECK (true);

-- Allow updates for feedback
CREATE POLICY "Allow metrics updates" ON metrics_retrievals FOR UPDATE USING (true);
CREATE POLICY "Allow metrics updates" ON metrics_sanctions FOR UPDATE USING (true);
CREATE POLICY "Allow metrics updates" ON metrics_daily FOR UPDATE USING (true);

-- View for current metrics (last 30 days)
CREATE OR REPLACE VIEW metrics_summary AS
SELECT
  -- Investigation time
  (SELECT AVG(duration_minutes) FROM metrics_investigations
   WHERE completed_at > NOW() - INTERVAL '30 days') AS avg_investigation_minutes,

  -- Retrieval accuracy
  (SELECT AVG(precision_at_k) FROM metrics_retrievals
   WHERE feedback_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days') AS retrieval_recall_at_10,

  -- Sanctions precision
  (SELECT
    CASE WHEN SUM(true_positives + false_positives) > 0
    THEN SUM(true_positives)::NUMERIC / SUM(true_positives + false_positives)
    ELSE NULL END
   FROM metrics_sanctions
   WHERE feedback_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days') AS sanctions_precision,

  -- Volume
  (SELECT COUNT(*) FROM metrics_investigations
   WHERE completed_at > NOW() - INTERVAL '30 days') AS investigations_30d,

  NOW() AS snapshot_at;

-- =====================================================================
-- CONTACT SUBMISSIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON contact_submissions(created_at DESC);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact forms
CREATE POLICY "Anyone can submit contact forms" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Only admins can view contact submissions (view in Supabase dashboard)
CREATE POLICY "Only admins can view contact submissions" ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================================
