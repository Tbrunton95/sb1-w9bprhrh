/*
  # Create Skills Table

  1. New Table: `player_skills`
    - `id` (uuid, primary key)
    - `session_id` (uuid, foreign key to game_sessions)
    - `skill_name` (text) - name of the skill
    - `skill_category` (text) - 'combat', 'social', 'criminal', 'survival'
    - `level` (integer) - current skill level 1-10
    - `experience` (integer) - XP towards next level
    - `experience_to_next` (integer) - XP needed for next level
    - `description` (text) - what this skill does
    - `last_used` (integer) - game day when last used
    - `times_used` (integer) - total usage count
    - `metadata` (jsonb) - additional data
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Default Skills
    - Negotiation (social) - affects deal prices, NPC trust gains
    - Intimidation (social) - affects NPC fear, aggressive outcomes
    - Combat (combat) - affects fight outcomes, damage dealt
    - Stealth (criminal) - affects avoiding detection, sneaking
    - Streetwise (criminal) - affects finding deals, avoiding scams
    - Driving (survival) - affects vehicle handling, chases
    - Resilience (survival) - affects recovery from injuries, stress

  3. Security
    - Enable RLS with open policies for development
*/

CREATE TABLE IF NOT EXISTS player_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  skill_category text NOT NULL CHECK (skill_category IN ('combat', 'social', 'criminal', 'survival')),
  level integer DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  experience integer DEFAULT 0 CHECK (experience >= 0),
  experience_to_next integer DEFAULT 100,
  description text,
  last_used integer,
  times_used integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, skill_name)
);

-- Enable RLS
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;

-- Open policy for development
CREATE POLICY "Allow all operations on player_skills"
  ON player_skills FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_skills_session_id ON player_skills(session_id);
CREATE INDEX IF NOT EXISTS idx_player_skills_category ON player_skills(session_id, skill_category);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_player_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER player_skills_updated_at
  BEFORE UPDATE ON player_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_player_skills_updated_at();
