/*
  # Add NPC Significance Tracking

  1. Changes to `npcs` table
    - Add `role` field (e.g., "contact", "crew_member", "target", "generic")
    - Add `is_significant` boolean flag
    - Add `story_importance` text field for AI context
    - Add `first_met_day` integer to track when player met them
    
  2. Changes to `relationships` table
    - Add `npc_id` uuid field to properly link to npcs table
    - Add `trust_score` integer (0-100)
    - Add `status` field (allied, neutral, hostile)
    - Add `interaction_count` integer
    - Add `last_interaction` text to store what happened
    
  This enables smart filtering so only story-significant NPCs appear in the relationships panel.
*/

-- Add new columns to npcs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'role'
  ) THEN
    ALTER TABLE npcs ADD COLUMN role text DEFAULT 'generic';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'is_significant'
  ) THEN
    ALTER TABLE npcs ADD COLUMN is_significant boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'story_importance'
  ) THEN
    ALTER TABLE npcs ADD COLUMN story_importance text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'first_met_day'
  ) THEN
    ALTER TABLE npcs ADD COLUMN first_met_day integer DEFAULT 0;
  END IF;
END $$;

-- Add new columns to relationships table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'npc_id'
  ) THEN
    ALTER TABLE relationships ADD COLUMN npc_id uuid REFERENCES npcs(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE relationships ADD COLUMN trust_score integer DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'status'
  ) THEN
    ALTER TABLE relationships ADD COLUMN status text DEFAULT 'neutral';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'interaction_count'
  ) THEN
    ALTER TABLE relationships ADD COLUMN interaction_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'last_interaction'
  ) THEN
    ALTER TABLE relationships ADD COLUMN last_interaction text DEFAULT '';
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_npcs_significant ON npcs(is_significant) WHERE is_significant = true;