/*
  # Enhance Sessions and Add Session Results

  1. Enhanced Sessions Table
    - Add session_number (INTEGER) - Sequential session number per client
    - Add pre_session_mood (VARCHAR) - Client mood before session
    - Add post_session_mood (VARCHAR) - Client mood after session
    - Add energy_level_start (INTEGER) - Energy level 1-10 before session
    - Add energy_level_end (INTEGER) - Energy level 1-10 after session
    - Add session_focus (TEXT[]) - Array of topics covered
    - Add techniques_used (TEXT[]) - Coaching techniques applied
    - Add insights (JSONB) - Structured insights from session
    - Add breakthrough_moments (TEXT[]) - Key breakthrough moments
    - Add challenges_discussed (TEXT[]) - Challenges addressed
    - Add homework_assigned (JSONB) - Homework/tasks assigned
    - Add client_feedback (TEXT) - Client's feedback post-session
    - Add coach_observations (TEXT) - Coach's observations
    - Add recording_url (VARCHAR) - Optional session recording link

  2. New Session Results Table
    - id (uuid, primary key)
    - session_id (uuid, foreign key to sessions)
    - what_worked_well (TEXT) - What was effective
    - what_to_improve (TEXT) - Areas for improvement
    - key_insights (TEXT[]) - Main insights array
    - action_items (JSONB) - Action items with details
    - client_commitments (TEXT[]) - What client committed to
    - coach_commitments (TEXT[]) - What coach committed to
    - next_session_focus (TEXT) - Focus for next session
    - created_at, updated_at timestamps

  3. Security
    - Enable RLS on session_results table
    - Add policies for coaches to manage their session results
*/

-- Enhance sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pre_session_mood VARCHAR(50);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS post_session_mood VARCHAR(50);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS energy_level_start INTEGER CHECK (energy_level_start >= 1 AND energy_level_start <= 10);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS energy_level_end INTEGER CHECK (energy_level_end >= 1 AND energy_level_end <= 10);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_focus TEXT[];
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS techniques_used TEXT[];
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS insights JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS breakthrough_moments TEXT[];
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS challenges_discussed TEXT[];
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS homework_assigned JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS client_feedback TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coach_observations TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500);

-- Create session_results table
CREATE TABLE IF NOT EXISTS session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  what_worked_well TEXT,
  what_to_improve TEXT,
  key_insights TEXT[],
  action_items JSONB,
  client_commitments TEXT[],
  coach_commitments TEXT[],
  next_session_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;

-- Policies for session_results
CREATE POLICY "Coaches can view their session results"
  ON session_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_results.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert their session results"
  ON session_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_results.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their session results"
  ON session_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_results.session_id
      AND sessions.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_results.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete their session results"
  ON session_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_results.session_id
      AND sessions.coach_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_session_results_session_id ON session_results(session_id);
