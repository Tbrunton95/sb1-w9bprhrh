/*
  # Add Reasoning Field to Conversation History
  
  1. Changes
    - Add `reasoning` column to conversation_history table
    - This stores the AI's internal thinking/reasoning process for debugging
    
  2. Details
    - Column is TEXT type (can be long)
    - Nullable (older messages won't have it)
    - No default value
*/

-- Add reasoning column to conversation_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'reasoning'
  ) THEN
    ALTER TABLE conversation_history ADD COLUMN reasoning text;
  END IF;
END $$;