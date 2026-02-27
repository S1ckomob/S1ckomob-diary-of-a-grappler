-- Competitions table for tracking tournament history
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  division TEXT,
  weight_class TEXT,
  gi BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  result TEXT, -- 'gold', 'silver', 'bronze', 'dnp' (did not place)
  matches_won INT NOT NULL DEFAULT 0,
  matches_lost INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_user_id ON competitions(user_id, date DESC);

-- RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitions"
  ON competitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own competitions"
  ON competitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitions"
  ON competitions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitions"
  ON competitions FOR DELETE
  USING (auth.uid() = user_id);
