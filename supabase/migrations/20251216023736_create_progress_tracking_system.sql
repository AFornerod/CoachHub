/*
  # Create Progress Tracking System

  1. New Tables
    - `progress_entries`
      - id (uuid, primary key)
      - client_id (uuid, foreign key to clients)
      - objective_id (uuid, foreign key to plan_objectives)
      - session_id (uuid, foreign key to sessions)
      - entry_date (date) - When progress was recorded
      - progress_value (decimal) - Progress measurement
      - notes (text) - Additional notes
      - evidence_urls (text[]) - Links to evidence
      - created_at timestamp

    - `achievements`
      - id (uuid, primary key)
      - client_id (uuid, foreign key to clients)
      - plan_id (uuid, foreign key to coaching_plans)
      - objective_id (uuid, foreign key to plan_objectives)
      - title (varchar) - Achievement title
      - description (text) - Achievement description
      - achievement_date (date) - When achieved
      - category (varchar) - win, breakthrough, milestone, habit_formed
      - significance (varchar) - small, medium, large, transformational
      - what_led_to_it (text) - Context and journey
      - impact (text) - Impact of achievement
      - evidence_urls (text[]) - Evidence links
      - celebrated (boolean) - Whether it was celebrated
      - celebration_notes (text) - How it was celebrated
      - created_at timestamp

    - `before_after_comparisons`
      - id (uuid, primary key)
      - client_id (uuid, foreign key to clients)
      - plan_id (uuid, foreign key to coaching_plans)
      - area (varchar) - Area being compared
      - before_description (text) - Before state
      - before_value (decimal) - Before measurement
      - before_date (date) - Before date
      - before_evidence_urls (text[]) - Before evidence
      - after_description (text) - After state
      - after_value (decimal) - After measurement
      - after_date (date) - After date
      - after_evidence_urls (text[]) - After evidence
      - improvement_percentage (decimal) - Calculated improvement
      - key_changes (text[]) - Key differences
      - created_at timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for coaches to manage their client progress
*/

-- Create progress_entries table
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  objective_id UUID REFERENCES plan_objectives(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_value DECIMAL,
  notes TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES coaching_plans(id) ON DELETE SET NULL,
  objective_id UUID REFERENCES plan_objectives(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achievement_date DATE NOT NULL,
  category VARCHAR(100) CHECK (category IN ('win', 'breakthrough', 'milestone', 'habit_formed')),
  significance VARCHAR(50) DEFAULT 'medium' CHECK (significance IN ('small', 'medium', 'large', 'transformational')),
  what_led_to_it TEXT,
  impact TEXT,
  evidence_urls TEXT[],
  celebrated BOOLEAN DEFAULT false,
  celebration_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create before_after_comparisons table
CREATE TABLE IF NOT EXISTS before_after_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES coaching_plans(id) ON DELETE SET NULL,
  area VARCHAR(255) NOT NULL,
  before_description TEXT,
  before_value DECIMAL,
  before_date DATE,
  before_evidence_urls TEXT[],
  after_description TEXT,
  after_value DECIMAL,
  after_date DATE,
  after_evidence_urls TEXT[],
  improvement_percentage DECIMAL,
  key_changes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE before_after_comparisons ENABLE ROW LEVEL SECURITY;

-- Policies for progress_entries
CREATE POLICY "Coaches can view progress entries for their clients"
  ON progress_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = progress_entries.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert progress entries for their clients"
  ON progress_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = progress_entries.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update progress entries for their clients"
  ON progress_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = progress_entries.client_id
      AND clients.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = progress_entries.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete progress entries for their clients"
  ON progress_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = progress_entries.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Policies for achievements
CREATE POLICY "Coaches can view achievements for their clients"
  ON achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = achievements.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert achievements for their clients"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = achievements.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update achievements for their clients"
  ON achievements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = achievements.client_id
      AND clients.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = achievements.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete achievements for their clients"
  ON achievements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = achievements.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Policies for before_after_comparisons
CREATE POLICY "Coaches can view comparisons for their clients"
  ON before_after_comparisons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = before_after_comparisons.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert comparisons for their clients"
  ON before_after_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = before_after_comparisons.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update comparisons for their clients"
  ON before_after_comparisons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = before_after_comparisons.client_id
      AND clients.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = before_after_comparisons.client_id
      AND clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete comparisons for their clients"
  ON before_after_comparisons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = before_after_comparisons.client_id
      AND clients.coach_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_entries_client_id ON progress_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_objective_id ON progress_entries(objective_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_entry_date ON progress_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_achievements_client_id ON achievements(client_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_date ON achievements(achievement_date);
CREATE INDEX IF NOT EXISTS idx_before_after_comparisons_client_id ON before_after_comparisons(client_id);
