/*
  # Add Missing Game Session Columns
  
  1. Changes
    - Rename `character_name` to `player_name` for consistency
    - Add `reputation` (integer 0-100, social standing)
    - Add `heat_level` (integer 0-100, police attention)
    - Add `game_status` (text enum for game state)
  
  2. Notes
    - Reputation starts at 10 (low)
    - Heat level starts at 5 (minimal police attention)
    - Game status defaults to 'active'
*/

-- Rename character_name to player_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'character_name'
  ) THEN
    ALTER TABLE game_sessions RENAME COLUMN character_name TO player_name;
  END IF;
END $$;

-- Add reputation tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'reputation'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN reputation integer DEFAULT 10 NOT NULL CHECK (reputation >= 0 AND reputation <= 100);
  END IF;
END $$;

-- Add heat level (police attention)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'heat_level'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN heat_level integer DEFAULT 5 NOT NULL CHECK (heat_level >= 0 AND heat_level <= 100);
  END IF;
END $$;

-- Add game status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'game_status'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN game_status text DEFAULT 'active' NOT NULL CHECK (game_status IN ('active', 'paused', 'ended', 'won'));
  END IF;
END $$;
