/*
  # Create Coaching Plans System

  1. New Tables
    - `coaching_plans`
      - id (uuid, primary key)
      - client_id (uuid, foreign key to clients)
      - coach_id (uuid, foreign key to users)
      - title (varchar) - Plan title
      - description (text) - Plan description
      - start_date (date) - When plan starts
      - target_end_date (date) - Expected end date
      - actual_end_date (date) - Actual completion date
      - status (varchar) - active, paused, completed, cancelled
      - total_sessions_planned (integer) - Number of sessions planned
      - sessions_completed (integer) - Sessions completed so far
      - coaching_approach (varchar) - Methodology used
      - focus_areas (text[]) - Main focus areas
      - phases (jsonb) - Plan phases structure
      - created_at, updated_at timestamps

    - `plan_objectives`
      - id (uuid, primary key)
      - plan_id (uuid, foreign key to coaching_plans)
      - title (varchar) - Objective title
      - description (text) - Objective description
      - specific (text) - SMART: Specific
      - measurable (text) - SMART: Measurable
      - achievable (text) - SMART: Achievable
      - relevant (text) - SMART: Relevant
      - time_bound (date) - SMART: Time-bound deadline
      - category (varchar) - Personal, Professional, Health, etc.
      - priority (varchar) - high, medium, low
      - status (varchar) - not_started, in_progress, completed, abandoned
      - progress (integer) - 0-100 percentage
      - target_value (decimal) - Target numeric value
      - current_value (decimal) - Current numeric value
      - unit (varchar) - Measurement unit
      - created_at, updated_at timestamps

    - `plan_milestones`
      - id (uuid, primary key)
      - plan_id (uuid, foreign key to coaching_plans)
      - title (varchar) - Milestone title
      - description (text) - Milestone description
      - target_date (date) - Expected completion date
      - completed_date (date) - Actual completion date
      - status (varchar) - pending, completed, delayed
      - associated_objectives (uuid[]) - Related objectives
      - created_at timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for coaches to manage their plans
*/

-- Create coaching_plans table
CREATE TABLE IF NOT EXISTS coaching_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  target_end_date DATE,
  actual_end_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  total_sessions_planned INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  coaching_approach VARCHAR(100),
  focus_areas TEXT[],
  phases JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plan_objectives table
CREATE TABLE IF NOT EXISTS plan_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES coaching_plans(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound DATE,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plan_milestones table
CREATE TABLE IF NOT EXISTS plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES coaching_plans(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'delayed')),
  associated_objectives UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for coaching_plans
CREATE POLICY "Coaches can view their coaching plans"
  ON coaching_plans FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their coaching plans"
  ON coaching_plans FOR INSERT
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their coaching plans"
  ON coaching_plans FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their coaching plans"
  ON coaching_plans FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- Policies for plan_objectives
CREATE POLICY "Coaches can view objectives from their plans"
  ON plan_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_objectives.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert objectives to their plans"
  ON plan_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_objectives.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update objectives from their plans"
  ON plan_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_objectives.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_objectives.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete objectives from their plans"
  ON plan_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_objectives.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

-- Policies for plan_milestones
CREATE POLICY "Coaches can view milestones from their plans"
  ON plan_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_milestones.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert milestones to their plans"
  ON plan_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_milestones.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update milestones from their plans"
  ON plan_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_milestones.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_milestones.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete milestones from their plans"
  ON plan_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_plans
      WHERE coaching_plans.id = plan_milestones.plan_id
      AND coaching_plans.coach_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coaching_plans_client_id ON coaching_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_coaching_plans_coach_id ON coaching_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_plan_objectives_plan_id ON plan_objectives(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_milestones_plan_id ON plan_milestones(plan_id);
