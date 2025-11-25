/*
  # Fix Game Events Table Columns
  
  1. Changes
    - Rename `game_day` to `day_occurred` for consistency
    - Add `consequences` (jsonb, stores event outcomes and effects)
  
  2. Notes
    - Consequences defaults to empty object
    - Day occurred tracks when event happened in game time
*/

-- Rename game_day to day_occurred
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_events' AND column_name = 'game_day'
  ) THEN
    ALTER TABLE game_events RENAME COLUMN game_day TO day_occurred;
  END IF;
END $$;

-- Add consequences field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_events' AND column_name = 'consequences'
  ) THEN
    ALTER TABLE game_events ADD COLUMN consequences jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;
END $$;
