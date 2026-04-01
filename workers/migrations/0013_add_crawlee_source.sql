-- Add 'crawlee' to source_type CHECK constraint.
-- Uses table recreation pattern (D1/SQLite has no ALTER COLUMN).

CREATE TABLE ideas_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  problem_statement TEXT,
  target_audience TEXT,
  market_size_json TEXT,
  competitors_json TEXT,
  competitor_count INTEGER DEFAULT 0,
  build_complexity TEXT CHECK(build_complexity IN ('low', 'medium', 'high')),
  build_timeline TEXT,
  monetization_angle TEXT,
  confidence_score INTEGER CHECK(confidence_score BETWEEN 0 AND 100),
  source_links_json TEXT,
  source_type TEXT CHECK(source_type IN (
    'reddit', 'google_trends', 'producthunt',
    'hackernews', 'github_trending', 'devto', 'lobsters', 'newsapi',
    'stackexchange', 'github_issues', 'discourse', 'package_trends',
    'crawlee'
  )),
  created_at TEXT DEFAULT (datetime('now')),
  narrative_writeup TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  validation_playbook TEXT DEFAULT '',
  gtm_strategy TEXT DEFAULT '',
  scores_json TEXT DEFAULT '{}',
  community_signals_json TEXT DEFAULT '[]',
  frameworks_json TEXT DEFAULT '{}',
  UNIQUE(title_normalized)
);

INSERT INTO ideas_new SELECT * FROM ideas;

DROP TABLE ideas;
ALTER TABLE ideas_new RENAME TO ideas;

CREATE INDEX IF NOT EXISTS idx_ideas_confidence ON ideas(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_complexity ON ideas(build_complexity);
CREATE INDEX IF NOT EXISTS idx_ideas_source ON ideas(source_type);

-- Rebuild FTS index (triggers were dropped with the old table)
DELETE FROM ideas_fts;
INSERT INTO ideas_fts(rowid, title, narrative_writeup)
  SELECT rowid, title, COALESCE(narrative_writeup, '') FROM ideas;

-- Recreate FTS sync triggers
CREATE TRIGGER IF NOT EXISTS ideas_fts_insert AFTER INSERT ON ideas BEGIN
  INSERT INTO ideas_fts(rowid, title, narrative_writeup)
    VALUES (NEW.rowid, NEW.title, COALESCE(NEW.narrative_writeup, ''));
END;

CREATE TRIGGER IF NOT EXISTS ideas_fts_delete AFTER DELETE ON ideas BEGIN
  INSERT INTO ideas_fts(ideas_fts, rowid, title, narrative_writeup)
    VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.narrative_writeup, ''));
END;

CREATE TRIGGER IF NOT EXISTS ideas_fts_update AFTER UPDATE ON ideas BEGIN
  INSERT INTO ideas_fts(ideas_fts, rowid, title, narrative_writeup)
    VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.narrative_writeup, ''));
  INSERT INTO ideas_fts(rowid, title, narrative_writeup)
    VALUES (NEW.rowid, NEW.title, COALESCE(NEW.narrative_writeup, ''));
END;
