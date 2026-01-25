-- Supabase Database Schema for Marlowe (Lead Collection)
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
