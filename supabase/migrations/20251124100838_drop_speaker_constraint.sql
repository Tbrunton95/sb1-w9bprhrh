/*
  # Drop Speaker Constraint
  
  1. Changes
    - Remove the check constraint on speaker column
    - This allows any speaker value (e.g., 'You', 'Narrator', character names)
  
  2. Notes
    - Original constraint was too restrictive
    - Game uses dynamic speaker names
*/

-- Drop the old role check constraint
ALTER TABLE conversation_history DROP CONSTRAINT IF EXISTS conversation_history_role_check;
