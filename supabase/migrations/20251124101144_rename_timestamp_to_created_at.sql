/*
  # Rename timestamp to created_at in conversation_history
  
  1. Changes
    - Rename `timestamp` column to `created_at` for consistency
  
  2. Notes
    - Matches the pattern used in other tables
    - Makes the codebase more consistent
*/

-- Rename timestamp to created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE conversation_history RENAME COLUMN timestamp TO created_at;
  END IF;
END $$;
