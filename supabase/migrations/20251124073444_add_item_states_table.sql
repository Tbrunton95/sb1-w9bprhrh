/*
  # Add Item States Table

  1. New Table
    - `item_states` - Tracks state of weapons, equipment, and other items
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to game_sessions)
      - `item_type` (text - 'weapon', 'equipment', 'drug', etc.)
      - `item_id` (text - unique identifier for the item)
      - `item_name` (text - display name)
      - `equipped` (boolean - is item currently equipped/drawn)
      - `quantity` (integer - for stackable items like ammo, drugs)
      - `metadata` (jsonb - additional item-specific data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `item_states` table
    - Add policies for authenticated users to manage their own items

  3. Indexes
    - Add index on session_id for fast lookups
    - Add unique constraint on session_id + item_id
*/

-- Create item_states table
CREATE TABLE IF NOT EXISTS item_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('weapon', 'equipment', 'drug', 'consumable')),
  item_id text NOT NULL,
  item_name text NOT NULL,
  equipped boolean DEFAULT false,
  quantity integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_states_session_item_unique'
  ) THEN
    ALTER TABLE item_states ADD CONSTRAINT item_states_session_item_unique UNIQUE (session_id, item_id);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_item_states_session ON item_states(session_id);
CREATE INDEX IF NOT EXISTS idx_item_states_type ON item_states(item_type);

-- Enable RLS
ALTER TABLE item_states ENABLE ROW LEVEL SECURITY;

-- Policies for item_states
CREATE POLICY "Users can view own item states"
  ON item_states FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

CREATE POLICY "Users can insert own item states"
  ON item_states FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

CREATE POLICY "Users can update own item states"
  ON item_states FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

CREATE POLICY "Users can delete own item states"
  ON item_states FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_item_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_item_states_updated_at_trigger ON item_states;
CREATE TRIGGER update_item_states_updated_at_trigger
  BEFORE UPDATE ON item_states
  FOR EACH ROW
  EXECUTE FUNCTION update_item_states_updated_at();