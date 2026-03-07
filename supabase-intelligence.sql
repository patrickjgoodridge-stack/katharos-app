-- =====================================================================
-- INTELLIGENCE SYSTEMS - Database Schema
-- Entity Resolution, Precedent Matching, Crowd Wisdom, Temporal Patterns
-- =====================================================================

-- =====================================================================
-- ENTITY NODES - Canonical entities (deduplicated)
-- =====================================================================

CREATE TABLE IF NOT EXISTS entity_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  canonical_name TEXT NOT NULL,

  -- Aggregated stats
  total_screenings INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_workspaces INTEGER DEFAULT 0,

  -- Risk signals
  avg_risk_score FLOAT,
  max_risk_level TEXT,

  -- Enforcement status
  is_sanctioned BOOLEAN DEFAULT FALSE,
  sanction_lists JSONB DEFAULT '[]',
  enforcement_actions JSONB DEFAULT '[]',

  -- Flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_false_positive BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_entity_nodes_canonical ON entity_nodes(canonical_name);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_sanctioned ON entity_nodes(is_sanctioned) WHERE is_sanctioned = TRUE;

ALTER TABLE entity_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_nodes_select" ON entity_nodes FOR SELECT USING (true);
CREATE POLICY "entity_nodes_insert" ON entity_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "entity_nodes_update" ON entity_nodes FOR UPDATE USING (true);
CREATE POLICY "entity_nodes_delete" ON entity_nodes FOR DELETE USING (true);

-- =====================================================================
-- ENTITY VARIANTS - Name aliases linked to canonical nodes
-- =====================================================================

CREATE TABLE IF NOT EXISTS entity_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_node_id UUID REFERENCES entity_nodes(id) ON DELETE CASCADE,

  variant_name TEXT NOT NULL,
  variant_type TEXT,  -- 'alias', 'typo', 'transliteration', 'abbreviation', 'legal_name', 'primary'

  source TEXT,  -- 'user_session', 'user_case', 'sanctions_list', 'manual', 'fuzzy_match'
  confidence FLOAT DEFAULT 0.5,

  times_searched INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_node_id, variant_name)
);

CREATE INDEX IF NOT EXISTS idx_entity_variants_name ON entity_variants(variant_name);
CREATE INDEX IF NOT EXISTS idx_entity_variants_node ON entity_variants(entity_node_id);

ALTER TABLE entity_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_variants_select" ON entity_variants FOR SELECT USING (true);
CREATE POLICY "entity_variants_insert" ON entity_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "entity_variants_update" ON entity_variants FOR UPDATE USING (true);
CREATE POLICY "entity_variants_delete" ON entity_variants FOR DELETE USING (true);

-- =====================================================================
-- ENTITY EDGES - Relationships between entities
-- =====================================================================

CREATE TABLE IF NOT EXISTS entity_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_entity_id UUID REFERENCES entity_nodes(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES entity_nodes(id) ON DELETE CASCADE,

  relationship_type TEXT,  -- 'subsidiary', 'parent', 'associated', 'beneficial_owner', 'frequently_co_searched', 'unknown'
  confidence FLOAT DEFAULT 0.5,

  evidence JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_entity_id, target_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_edges_source ON entity_edges(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_edges_target ON entity_edges(target_entity_id);

ALTER TABLE entity_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_edges_select" ON entity_edges FOR SELECT USING (true);
CREATE POLICY "entity_edges_insert" ON entity_edges FOR INSERT WITH CHECK (true);
CREATE POLICY "entity_edges_update" ON entity_edges FOR UPDATE USING (true);

-- =====================================================================
-- ENFORCEMENT ACTIONS - Public enforcement data for precedent matching
-- =====================================================================

CREATE TABLE IF NOT EXISTS enforcement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  source TEXT NOT NULL,         -- 'ofac', 'bis', 'doj', 'sec', 'fincen'
  source_url TEXT,
  source_date DATE,

  entity_name TEXT NOT NULL,
  entity_aliases JSONB DEFAULT '[]',

  jurisdiction TEXT,
  sector TEXT,
  violation_type TEXT,
  programs JSONB DEFAULT '[]',

  penalty_amount NUMERIC,
  penalty_type TEXT,            -- 'civil', 'criminal', 'debarment', 'entity_list'

  description TEXT,

  embedding_id TEXT             -- Reference to Pinecone vector
);

CREATE INDEX IF NOT EXISTS idx_enforcement_entity ON enforcement_actions(entity_name);
CREATE INDEX IF NOT EXISTS idx_enforcement_source ON enforcement_actions(source, source_date);
CREATE INDEX IF NOT EXISTS idx_enforcement_jurisdiction ON enforcement_actions(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_enforcement_sector ON enforcement_actions(sector);

ALTER TABLE enforcement_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enforcement_select" ON enforcement_actions FOR SELECT USING (true);
CREATE POLICY "enforcement_insert" ON enforcement_actions FOR INSERT WITH CHECK (true);

-- =====================================================================
-- SCREENING OUTCOMES - Learned from user behavior (implicit labels)
-- =====================================================================

CREATE TABLE IF NOT EXISTS screening_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id TEXT,
  entity_node_id UUID REFERENCES entity_nodes(id) ON DELETE SET NULL,

  -- Outcome signals (implicit)
  was_escalated BOOLEAN DEFAULT FALSE,
  was_reported BOOLEAN DEFAULT FALSE,
  was_blocked BOOLEAN DEFAULT FALSE,
  report_generated BOOLEAN DEFAULT FALSE,

  -- Time-based outcomes
  later_sanctioned BOOLEAN DEFAULT FALSE,
  sanctioned_date DATE,

  -- Feature snapshot at time of screening
  features_at_screening JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_outcomes_entity ON screening_outcomes(entity_node_id);
CREATE INDEX IF NOT EXISTS idx_screening_outcomes_screening ON screening_outcomes(screening_id);

ALTER TABLE screening_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screening_outcomes_select" ON screening_outcomes FOR SELECT USING (true);
CREATE POLICY "screening_outcomes_insert" ON screening_outcomes FOR INSERT WITH CHECK (true);
CREATE POLICY "screening_outcomes_update" ON screening_outcomes FOR UPDATE USING (true);

-- =====================================================================
-- PLATFORM ALERTS - Generated by temporal pattern detection
-- =====================================================================

CREATE TABLE IF NOT EXISTS platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,     -- 'critical', 'warning', 'info'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_alerts_type ON platform_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_created ON platform_alerts(created_at DESC);

ALTER TABLE platform_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_alerts_select" ON platform_alerts FOR SELECT USING (true);
CREATE POLICY "platform_alerts_insert" ON platform_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "platform_alerts_update" ON platform_alerts FOR UPDATE USING (true);

-- =====================================================================
-- SQL FUNCTIONS - Aggregation queries for intelligence systems
-- =====================================================================

-- Entity co-occurrence computation
CREATE OR REPLACE FUNCTION compute_entity_co_occurrences()
RETURNS TABLE (
  entity1_name TEXT,
  entity2_name TEXT,
  co_occurrence_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e1.entity_name AS entity1_name,
    e2.entity_name AS entity2_name,
    COUNT(*)::BIGINT AS co_occurrence_count,
    COUNT(DISTINCT e1.user_email)::BIGINT AS unique_users
  FROM events e1
  JOIN events e2
    ON e1.session_id = e2.session_id
    AND e1.entity_name < e2.entity_name
    AND ABS(EXTRACT(EPOCH FROM (e1.created_at - e2.created_at))) < 600
  WHERE e1.event_type = 'screening.completed'
    AND e2.event_type = 'screening.completed'
    AND e1.created_at > NOW() - INTERVAL '90 days'
    AND e1.entity_name IS NOT NULL
    AND e2.entity_name IS NOT NULL
  GROUP BY e1.entity_name, e2.entity_name
  HAVING COUNT(DISTINCT e1.user_email) >= 2
  ORDER BY co_occurrence_count DESC
  LIMIT 1000;
END;
$$ LANGUAGE plpgsql;

-- Entity crowd stats
CREATE OR REPLACE FUNCTION get_entity_crowd_stats(p_entity_name TEXT)
RETURNS TABLE (
  total_screenings BIGINT,
  unique_users BIGINT,
  unique_workspaces BIGINT,
  escalation_rate FLOAT,
  report_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_screenings,
    COUNT(DISTINCT e.user_email)::BIGINT AS unique_users,
    COUNT(DISTINCT e.email_domain)::BIGINT AS unique_workspaces,
    COALESCE(AVG(CASE WHEN so.was_escalated THEN 1.0 ELSE 0.0 END), 0)::FLOAT AS escalation_rate,
    COALESCE(AVG(CASE WHEN so.report_generated THEN 1.0 ELSE 0.0 END), 0)::FLOAT AS report_rate
  FROM events e
  LEFT JOIN entity_variants ev ON LOWER(e.entity_name) = LOWER(ev.variant_name)
  LEFT JOIN screening_outcomes so ON so.entity_node_id = ev.entity_node_id
  WHERE LOWER(e.entity_name) = LOWER(p_entity_name)
    AND e.event_type = 'screening.completed';
END;
$$ LANGUAGE plpgsql;

-- Trending entities
CREATE OR REPLACE FUNCTION get_trending_entities(result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  entity_name TEXT,
  screening_count BIGINT,
  unique_orgs BIGINT,
  percent_change FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT
      e.entity_name,
      COUNT(*) AS cnt,
      COUNT(DISTINCT e.email_domain) AS orgs
    FROM events e
    WHERE e.event_type = 'screening.completed'
      AND e.created_at > NOW() - INTERVAL '7 days'
      AND e.entity_name IS NOT NULL
    GROUP BY e.entity_name
  ),
  baseline AS (
    SELECT
      e.entity_name,
      COUNT(*) / GREATEST(EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days' - MIN(e.created_at))) / 604800, 1)::FLOAT AS weekly_avg
    FROM events e
    WHERE e.event_type = 'screening.completed'
      AND e.created_at > NOW() - INTERVAL '90 days'
      AND e.created_at <= NOW() - INTERVAL '7 days'
      AND e.entity_name IS NOT NULL
    GROUP BY e.entity_name
  )
  SELECT
    r.entity_name,
    r.cnt AS screening_count,
    r.orgs AS unique_orgs,
    CASE
      WHEN COALESCE(b.weekly_avg, 0) = 0 THEN 999.0
      ELSE ((r.cnt - b.weekly_avg) / b.weekly_avg * 100)
    END AS percent_change
  FROM recent r
  LEFT JOIN baseline b ON r.entity_name = b.entity_name
  WHERE r.cnt >= 3
  ORDER BY
    CASE
      WHEN COALESCE(b.weekly_avg, 0) = 0 THEN 999.0
      ELSE ((r.cnt - b.weekly_avg) / b.weekly_avg * 100)
    END DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Search term patterns for temporal detection
CREATE OR REPLACE FUNCTION get_search_term_patterns(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  term TEXT,
  count BIGINT,
  daily_count FLOAT,
  avg_daily_count FLOAT,
  std_daily_count FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_counts AS (
    SELECT
      e.entity_name AS term,
      DATE(e.created_at) AS day,
      COUNT(*) AS cnt
    FROM events e
    WHERE e.event_type = 'screening.completed'
      AND e.created_at > NOW() - (days_back || ' days')::INTERVAL
      AND e.entity_name IS NOT NULL
    GROUP BY e.entity_name, DATE(e.created_at)
  ),
  stats AS (
    SELECT
      dc.term,
      SUM(dc.cnt)::BIGINT AS total_count,
      AVG(dc.cnt)::FLOAT AS avg_daily,
      COALESCE(STDDEV(dc.cnt), 0)::FLOAT AS std_daily
    FROM daily_counts dc
    GROUP BY dc.term
  )
  SELECT
    s.term,
    s.total_count AS count,
    (s.total_count::FLOAT / GREATEST(days_back, 1)) AS daily_count,
    s.avg_daily AS avg_daily_count,
    s.std_daily AS std_daily_count
  FROM stats s
  ORDER BY s.total_count DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql;

-- Update entity statistics (daily batch)
CREATE OR REPLACE FUNCTION update_entity_statistics()
RETURNS void AS $$
BEGIN
  UPDATE entity_nodes en
  SET
    total_screenings = sub.total,
    unique_users = sub.users,
    unique_workspaces = sub.workspaces,
    updated_at = NOW()
  FROM (
    SELECT
      ev.entity_node_id,
      COUNT(*)::INTEGER AS total,
      COUNT(DISTINCT e.user_email)::INTEGER AS users,
      COUNT(DISTINCT e.email_domain)::INTEGER AS workspaces
    FROM events e
    JOIN entity_variants ev ON LOWER(e.entity_name) = LOWER(ev.variant_name)
    WHERE e.event_type = 'screening.completed'
    GROUP BY ev.entity_node_id
  ) sub
  WHERE en.id = sub.entity_node_id;
END;
$$ LANGUAGE plpgsql;
