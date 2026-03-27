-- User saved/rated ideas table.
-- user_id is the Clerk user ID (e.g. "user_2abc123").
CREATE TABLE IF NOT EXISTS saved_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  saved_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, idea_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_idea ON saved_ideas(idea_id);
