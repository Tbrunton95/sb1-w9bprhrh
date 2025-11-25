/*
  # Add Character Context and Memory System

  1. Player Character Fields
    - Add `appearance` (text) - physical description of player
    - Add `bio` (text) - player backstory and personality
  
  2. NPC Fields
    - Add `appearance` (text) - physical description of NPC
    - Add `bio` (text) - NPC backstory (already has personality)
  
  3. Item Context
    - Add `description` (text) - detailed item description for narrative
  
  4. NPC Conversation Memory
    - Create `npc_conversations` table to track dialogue history with each NPC
    - Stores conversation context for passing to LLM
  
  5. Event Tracking
    - Enhance `game_events` table with event categories (major/recent)
    - Add `event_category` field to distinguish event types
  
  6. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add player character fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'appearance'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN appearance text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'bio'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;

-- Add NPC fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'appearance'
  ) THEN
    ALTER TABLE npcs ADD COLUMN appearance text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'npcs' AND column_name = 'bio'
  ) THEN
    ALTER TABLE npcs ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;

-- Add item description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'item_states' AND column_name = 'description'
  ) THEN
    ALTER TABLE item_states ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Create NPC conversations table for memory
CREATE TABLE IF NOT EXISTS npc_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  npc_id uuid NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  player_message text NOT NULL,
  npc_response text NOT NULL,
  conversation_day integer NOT NULL,
  conversation_time timestamptz DEFAULT now(),
  context_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE npc_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own NPC conversations"
  ON npc_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = npc_conversations.session_id
    )
  );

CREATE POLICY "Users can insert own NPC conversations"
  ON npc_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = npc_conversations.session_id
    )
  );

-- Add event category to game_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_events' AND column_name = 'event_category'
  ) THEN
    ALTER TABLE game_events 
    ADD COLUMN event_category text DEFAULT 'recent' CHECK (event_category IN ('major', 'recent', 'minor'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_events' AND column_name = 'importance'
  ) THEN
    ALTER TABLE game_events 
    ADD COLUMN importance integer DEFAULT 5 CHECK (importance >= 1 AND importance <= 10);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_npc_conversations_session ON npc_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_npc_conversations_npc ON npc_conversations(npc_id);
CREATE INDEX IF NOT EXISTS idx_game_events_category ON game_events(event_category);
CREATE INDEX IF NOT EXISTS idx_game_events_importance ON game_events(importance);
