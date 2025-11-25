/*
  # Add Character Stats to Game Sessions

  1. Changes
    - Add `compulsion` column (integer 0-10, tracks urge to kill)
    - Add `humanity` column (integer 0-100, moral compass)
    - Add `days_since_kill` column (integer, tracks days without killing)
    - Add `current_minute` column (integer 0-59, for precise time tracking)
    - Set default values for new character stats
  
  2. Notes
    - Compulsion starts at 8 (high urge)
    - Humanity starts at 32 (morally compromised)
    - Days since kill starts at 24
    - Current minute starts at 14 (11:14 AM)
*/

DO $$
BEGIN
  -- Add compulsion tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'compulsion'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN compulsion integer DEFAULT 8 NOT NULL;
  END IF;

  -- Add humanity tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'humanity'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN humanity integer DEFAULT 32 NOT NULL;
  END IF;

  -- Add days since last kill
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'days_since_kill'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN days_since_kill integer DEFAULT 24 NOT NULL;
  END IF;

  -- Add minute precision to time tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'current_minute'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN current_minute integer DEFAULT 14 NOT NULL;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'compulsion_range'
  ) THEN
    ALTER TABLE game_sessions ADD CONSTRAINT compulsion_range CHECK (compulsion >= 0 AND compulsion <= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'humanity_range'
  ) THEN
    ALTER TABLE game_sessions ADD CONSTRAINT humanity_range CHECK (humanity >= 0 AND humanity <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'minute_range'
  ) THEN
    ALTER TABLE game_sessions ADD CONSTRAINT minute_range CHECK (current_minute >= 0 AND current_minute <= 59);
  END IF;
END $$;