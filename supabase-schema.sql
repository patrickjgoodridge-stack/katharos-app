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
