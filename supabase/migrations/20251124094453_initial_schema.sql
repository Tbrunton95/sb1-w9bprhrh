/*
  # Complete Game Database Schema
  
  1. Core Tables
    - `game_sessions` - Player game state and character data
    - `player_inventory` - Items, weapons, drugs, cash
    - `relationships` - NPC trust/relationship tracking
    - `active_deals` - Ongoing drug deals and transactions
    - `locations` - Game map locations
    - `npcs` - Non-player characters
    - `conversation_history` - Story narrative history
    - `game_events` - Major game events tracking
    - `item_states` - Detailed item state tracking
    - `npc_conversations` - NPC dialogue memory
    
  2. Security
    - Enable RLS on all tables
    - Public access policies for development (no auth required)
    
  3. Features
    - Character stats (humanity, compulsion, days since kill)
    - Time tracking (day, hour, minute)
    - Custom system prompts
    - Character appearance and bio
    - NPC memory and context
    - Item descriptions
*/

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  character_name text NOT NULL DEFAULT 'Damian Khaine',
  current_location text NOT NULL DEFAULT 'Kings Cross',
  current_day integer NOT NULL DEFAULT 1,
  current_hour integer NOT NULL DEFAULT 11,
  current_minute integer NOT NULL DEFAULT 14,
  compulsion integer DEFAULT 8 NOT NULL CHECK (compulsion >= 0 AND compulsion <= 10),
  humanity integer DEFAULT 32 NOT NULL CHECK (humanity >= 0 AND humanity <= 100),
  days_since_kill integer DEFAULT 24 NOT NULL,
  appearance text DEFAULT '',
  bio text DEFAULT '',
  custom_system_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player Inventory Table
CREATE TABLE IF NOT EXISTS player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Relationships Table
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  npc_name text NOT NULL,
  trust_level integer DEFAULT 0 CHECK (trust_level >= 0 AND trust_level <= 100),
  last_interaction_day integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Active Deals Table
CREATE TABLE IF NOT EXISTS active_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  deal_type text NOT NULL,
  description text NOT NULL,
  value integer DEFAULT 0,
  deadline_day integer,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  danger_level integer DEFAULT 1 CHECK (danger_level >= 1 AND danger_level <= 10),
  created_at timestamptz DEFAULT now()
);

-- NPCs Table
CREATE TABLE IF NOT EXISTS npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  location text NOT NULL,
  personality text,
  appearance text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Conversation History Table
CREATE TABLE IF NOT EXISTS conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Game Events Table
CREATE TABLE IF NOT EXISTS game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  game_day integer NOT NULL,
  event_category text DEFAULT 'recent' CHECK (event_category IN ('major', 'recent', 'minor')),
  importance integer DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at timestamptz DEFAULT now()
);

-- Item States Table
CREATE TABLE IF NOT EXISTS item_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('weapon', 'equipment', 'drug', 'consumable')),
  item_id text NOT NULL,
  item_name text NOT NULL,
  equipped boolean DEFAULT false,
  quantity integer DEFAULT 1,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT item_states_session_item_unique UNIQUE (session_id, item_id)
);

-- NPC Conversations Table
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

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_player_inventory_session ON player_inventory(session_id);
CREATE INDEX IF NOT EXISTS idx_relationships_session ON relationships(session_id);
CREATE INDEX IF NOT EXISTS idx_active_deals_session ON active_deals(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_session ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_game_events_session ON game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_item_states_session ON item_states(session_id);
CREATE INDEX IF NOT EXISTS idx_item_states_type ON item_states(item_type);
CREATE INDEX IF NOT EXISTS idx_npc_conversations_session ON npc_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_npc_conversations_npc ON npc_conversations(npc_id);
CREATE INDEX IF NOT EXISTS idx_game_events_category ON game_events(event_category);
CREATE INDEX IF NOT EXISTS idx_game_events_importance ON game_events(importance);

-- Enable RLS on all tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_conversations ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (Development)
-- Game Sessions
CREATE POLICY "Allow public read access to game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to game_sessions" ON game_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Player Inventory
CREATE POLICY "Allow public read access to player_inventory" ON player_inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert to player_inventory" ON player_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to player_inventory" ON player_inventory FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete from player_inventory" ON player_inventory FOR DELETE USING (true);

-- Relationships
CREATE POLICY "Allow public read access to relationships" ON relationships FOR SELECT USING (true);
CREATE POLICY "Allow public insert to relationships" ON relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to relationships" ON relationships FOR UPDATE USING (true) WITH CHECK (true);

-- Active Deals
CREATE POLICY "Allow public read access to active_deals" ON active_deals FOR SELECT USING (true);
CREATE POLICY "Allow public insert to active_deals" ON active_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to active_deals" ON active_deals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete from active_deals" ON active_deals FOR DELETE USING (true);

-- Locations
CREATE POLICY "Allow public read access to locations" ON locations FOR SELECT USING (true);

-- NPCs
CREATE POLICY "Allow public read access to npcs" ON npcs FOR SELECT USING (true);

-- Conversation History
CREATE POLICY "Allow public read access to conversation_history" ON conversation_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert to conversation_history" ON conversation_history FOR INSERT WITH CHECK (true);

-- Game Events
CREATE POLICY "Allow public read access to game_events" ON game_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_events" ON game_events FOR INSERT WITH CHECK (true);

-- Item States
CREATE POLICY "Allow public read access to item_states" ON item_states FOR SELECT USING (true);
CREATE POLICY "Allow public insert to item_states" ON item_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to item_states" ON item_states FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete from item_states" ON item_states FOR DELETE USING (true);

-- NPC Conversations
CREATE POLICY "Allow public read access to npc_conversations" ON npc_conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert to npc_conversations" ON npc_conversations FOR INSERT WITH CHECK (true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_player_inventory_updated_at ON player_inventory;
CREATE TRIGGER update_player_inventory_updated_at BEFORE UPDATE ON player_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_active_deals_updated_at ON active_deals;
CREATE TRIGGER update_active_deals_updated_at BEFORE UPDATE ON active_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_item_states_updated_at ON item_states;
CREATE TRIGGER update_item_states_updated_at BEFORE UPDATE ON item_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();
