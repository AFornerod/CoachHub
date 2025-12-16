/*
  # Competency Evaluation System

  ## Overview
  Creates a comprehensive system for evaluating client competencies using customizable frameworks.
  
  ## New Tables
  
  ### `competency_frameworks`
  Framework templates that group related competencies together
  - `id` (uuid, primary key)
  - `name` (text) - Framework name (e.g., "Leadership Assessment", "Communication Skills")
  - `description` (text) - Detailed description of the framework
  - `coach_id` (uuid) - Creator/owner of the framework
  - `is_public` (boolean) - Whether this framework is available to all coaches
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `competencies`
  Individual competencies within frameworks
  - `id` (uuid, primary key)
  - `framework_id` (uuid, foreign key) - Parent framework
  - `name` (text) - Competency name (e.g., "Active Listening", "Strategic Thinking")
  - `description` (text) - What this competency measures
  - `order_index` (integer) - Display order within framework
  - `created_at` (timestamptz)
  
  ### `competency_evaluations`
  Evaluation sessions for clients
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key) - Client being evaluated
  - `framework_id` (uuid, foreign key) - Framework used for evaluation
  - `coach_id` (uuid, foreign key) - Coach conducting evaluation
  - `evaluation_date` (date) - When evaluation was conducted
  - `notes` (text) - General notes about the evaluation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `competency_scores`
  Individual scores for each competency in an evaluation
  - `id` (uuid, primary key)
  - `evaluation_id` (uuid, foreign key) - Parent evaluation
  - `competency_id` (uuid, foreign key) - Competency being scored
  - `score` (integer) - Score value (1-10 scale)
  - `notes` (text) - Specific notes for this competency score
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Coaches can only access their own frameworks and evaluations
  - Public frameworks are readable by all authenticated coaches
*/

-- Create competency_frameworks table
CREATE TABLE IF NOT EXISTS competency_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  coach_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create competencies table
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid NOT NULL REFERENCES competency_frameworks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create competency_evaluations table
CREATE TABLE IF NOT EXISTS competency_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  framework_id uuid NOT NULL REFERENCES competency_frameworks(id) ON DELETE RESTRICT,
  coach_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create competency_scores table
CREATE TABLE IF NOT EXISTS competency_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES competency_evaluations(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, competency_id)
);

-- Enable RLS on all tables
ALTER TABLE competency_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competency_frameworks
CREATE POLICY "Coaches can view their own frameworks"
  ON competency_frameworks FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can view public frameworks"
  ON competency_frameworks FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Coaches can create frameworks"
  ON competency_frameworks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own frameworks"
  ON competency_frameworks FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own frameworks"
  ON competency_frameworks FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- RLS Policies for competencies
CREATE POLICY "Users can view competencies from accessible frameworks"
  ON competencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_frameworks
      WHERE competency_frameworks.id = competencies.framework_id
      AND (competency_frameworks.coach_id = auth.uid() OR competency_frameworks.is_public = true)
    )
  );

CREATE POLICY "Coaches can create competencies in their frameworks"
  ON competencies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competency_frameworks
      WHERE competency_frameworks.id = competencies.framework_id
      AND competency_frameworks.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update competencies in their frameworks"
  ON competencies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_frameworks
      WHERE competency_frameworks.id = competencies.framework_id
      AND competency_frameworks.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competency_frameworks
      WHERE competency_frameworks.id = competencies.framework_id
      AND competency_frameworks.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete competencies in their frameworks"
  ON competencies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_frameworks
      WHERE competency_frameworks.id = competencies.framework_id
      AND competency_frameworks.coach_id = auth.uid()
    )
  );

-- RLS Policies for competency_evaluations
CREATE POLICY "Coaches can view their own evaluations"
  ON competency_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create evaluations"
  ON competency_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own evaluations"
  ON competency_evaluations FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own evaluations"
  ON competency_evaluations FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- RLS Policies for competency_scores
CREATE POLICY "Users can view scores from accessible evaluations"
  ON competency_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_evaluations
      WHERE competency_evaluations.id = competency_scores.evaluation_id
      AND competency_evaluations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create scores for their evaluations"
  ON competency_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competency_evaluations
      WHERE competency_evaluations.id = competency_scores.evaluation_id
      AND competency_evaluations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update scores in their evaluations"
  ON competency_scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_evaluations
      WHERE competency_evaluations.id = competency_scores.evaluation_id
      AND competency_evaluations.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competency_evaluations
      WHERE competency_evaluations.id = competency_scores.evaluation_id
      AND competency_evaluations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete scores in their evaluations"
  ON competency_scores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competency_evaluations
      WHERE competency_evaluations.id = competency_scores.evaluation_id
      AND competency_evaluations.coach_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_frameworks_coach ON competency_frameworks(coach_id);
CREATE INDEX IF NOT EXISTS idx_frameworks_public ON competency_frameworks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_competencies_framework ON competencies(framework_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_client ON competency_evaluations(client_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_coach ON competency_evaluations(coach_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_framework ON competency_evaluations(framework_id);
CREATE INDEX IF NOT EXISTS idx_scores_evaluation ON competency_scores(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_scores_competency ON competency_scores(competency_id);

-- Insert default frameworks for demonstration
INSERT INTO competency_frameworks (name, description, coach_id, is_public)
SELECT 
  'Leadership Essentials',
  'Core leadership competencies for effective team management and organizational influence',
  id,
  true
FROM users
WHERE role = 'coach'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Get the framework id for inserting competencies
DO $$
DECLARE
  framework_id uuid;
BEGIN
  SELECT id INTO framework_id
  FROM competency_frameworks
  WHERE name = 'Leadership Essentials' AND is_public = true
  LIMIT 1;

  IF framework_id IS NOT NULL THEN
    INSERT INTO competencies (framework_id, name, description, order_index) VALUES
      (framework_id, 'Strategic Thinking', 'Ability to think long-term and develop effective strategies', 1),
      (framework_id, 'Communication', 'Clear and effective verbal and written communication skills', 2),
      (framework_id, 'Decision Making', 'Making timely and well-informed decisions', 3),
      (framework_id, 'Team Building', 'Creating and maintaining high-performing teams', 4),
      (framework_id, 'Emotional Intelligence', 'Understanding and managing emotions in self and others', 5),
      (framework_id, 'Adaptability', 'Flexibility and resilience in changing environments', 6),
      (framework_id, 'Vision Setting', 'Creating and communicating compelling visions', 7),
      (framework_id, 'Accountability', 'Taking responsibility and holding others accountable', 8)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;