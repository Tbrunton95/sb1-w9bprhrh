/*
  # Remove Compulsion and Humanity Columns
  
  1. Changes
    - Remove `compulsion` column from game_sessions
    - Remove `humanity` column from game_sessions
    - Remove `days_since_kill` column from game_sessions
    
  2. Reason
    - These features don't fit the game's theme
    - Game is about drug dealing, not murder simulation
*/

-- Remove the unnecessary columns
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_sessions' AND column_name = 'compulsion'
  ) THEN
    ALTER TABLE game_sessions DROP COLUMN compulsion;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_sessions' AND column_name = 'humanity'
  ) THEN
    ALTER TABLE game_sessions DROP COLUMN humanity;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_sessions' AND column_name = 'days_since_kill'
  ) THEN
    ALTER TABLE game_sessions DROP COLUMN days_since_kill;
  END IF;
END $$;