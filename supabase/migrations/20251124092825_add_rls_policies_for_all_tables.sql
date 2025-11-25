/*
  # Add RLS Policies for All Tables

  1. Security
    - Add SELECT policies for all tables (allow public read for game data)
    - Add INSERT policies for game_sessions, player_inventory, conversation_history
    - Add UPDATE policies for game_sessions, player_inventory, item_states
    - Add DELETE policies where needed
    
  2. Notes
    - These are permissive policies for development
    - In production, you'd want to add proper authentication checks
*/

-- Game Sessions Policies
CREATE POLICY "Allow public read access to game_sessions"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to game_sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to game_sessions"
  ON game_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Player Inventory Policies
CREATE POLICY "Allow public read access to player_inventory"
  ON player_inventory FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to player_inventory"
  ON player_inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to player_inventory"
  ON player_inventory FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Relationships Policies
CREATE POLICY "Allow public read access to relationships"
  ON relationships FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to relationships"
  ON relationships FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to relationships"
  ON relationships FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Active Deals Policies
CREATE POLICY "Allow public read access to active_deals"
  ON active_deals FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to active_deals"
  ON active_deals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to active_deals"
  ON active_deals FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Locations Policies
CREATE POLICY "Allow public read access to locations"
  ON locations FOR SELECT
  USING (true);

-- NPCs Policies
CREATE POLICY "Allow public read access to npcs"
  ON npcs FOR SELECT
  USING (true);

-- Conversation History Policies
CREATE POLICY "Allow public read access to conversation_history"
  ON conversation_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to conversation_history"
  ON conversation_history FOR INSERT
  WITH CHECK (true);

-- NPC Conversations Policies
CREATE POLICY "Allow public read access to npc_conversations"
  ON npc_conversations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to npc_conversations"
  ON npc_conversations FOR INSERT
  WITH CHECK (true);

-- Game Events Policies
CREATE POLICY "Allow public read access to game_events"
  ON game_events FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to game_events"
  ON game_events FOR INSERT
  WITH CHECK (true);

-- Item States Policies
CREATE POLICY "Allow public read access to item_states"
  ON item_states FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to item_states"
  ON item_states FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to item_states"
  ON item_states FOR UPDATE
  USING (true)
  WITH CHECK (true);