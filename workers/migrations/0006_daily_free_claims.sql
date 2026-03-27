CREATE TABLE IF NOT EXISTS daily_free_claims (
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  claimed_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, claimed_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_free_claims_user ON daily_free_claims(user_id, claimed_date);
