/*
  # Add Custom System Prompt Field

  1. Changes
    - Add `custom_system_prompt` column to `game_sessions` table
    - This allows players to customize the LLM's behavior/personality
    - Defaults to NULL (will use default game prompt if not set)
  
  2. Notes
    - Large text field to accommodate detailed prompts
    - Can be edited anytime during gameplay
    - Sent to OpenRouter with every narrative generation request
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'custom_system_prompt'
  ) THEN
    ALTER TABLE game_sessions 
    ADD COLUMN custom_system_prompt text;
  END IF;
END $$;
