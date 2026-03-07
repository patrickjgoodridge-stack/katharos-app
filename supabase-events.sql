-- =====================================================================
-- EVENTS TABLE - Append-only event log for intelligence systems
-- Foundation for: Entity Resolution, Precedent Matching, Search Patterns,
--   Crowd Wisdom, Temporal Detection, Risk Calibration, Query Classification
-- =====================================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Event identification
  event_type TEXT NOT NULL,          -- e.g. 'screening.completed', 'case.created'
  event_category TEXT NOT NULL,      -- e.g. 'screening', 'case', 'document', 'search'

  -- Session & user context
  session_id TEXT NOT NULL,          -- Client-generated session ID
  user_email TEXT,
  email_domain TEXT,

  -- Entity context (what was acted upon)
  entity_name TEXT,                  -- The name/query being screened or searched
  entity_type TEXT,                  -- 'individual', 'organization', 'vessel', etc.
  case_id TEXT,

  -- Event-specific payload (flexible)
  payload JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  client_timestamp TIMESTAMPTZ,     -- When it happened on the client
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for downstream intelligence queries
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_category_idx ON events(event_category);
CREATE INDEX IF NOT EXISTS events_session_idx ON events(session_id);
CREATE INDEX IF NOT EXISTS events_entity_name_idx ON events(entity_name);
CREATE INDEX IF NOT EXISTS events_case_id_idx ON events(case_id);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS events_email_domain_idx ON events(email_domain);

-- Composite indexes for intelligence system queries
CREATE INDEX IF NOT EXISTS events_entity_type_idx ON events(entity_name, event_type);
CREATE INDEX IF NOT EXISTS events_domain_type_idx ON events(email_domain, event_type, created_at DESC);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Append-only: INSERT only, no UPDATE or DELETE
-- Select restricted to own workspace for analytics
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_select" ON events FOR SELECT
  USING (email_domain = get_workspace_id());
