/*
  # Upgrade Active Deals System

  1. Schema Changes
    - Drop old simple active_deals table
    - Create new comprehensive active_deals table with:
      - `npc_id` (link to NPC making the deal)
      - `item` (what's being dealt)
      - `quantity` (how much)
      - `price_per_unit` (price per item)
      - `total_value` (total deal value)
      - `risk_level` (1-10, affects police attention)
      - `start_day` (when deal started)
      - `due_day` (deadline)
      - `location` (where deal happens)
      - `completion_details` (JSON for extra info)
      
  2. Security
    - Enable RLS on new table
    - Add policies for public access
    
  This creates a proper business deal system where:
  - AI can create deals with NPCs
  - Deals have deadlines and consequences
  - Risk levels affect heat/police attention
  - Completion tracking with rewards/penalties
*/

-- Drop old table if exists
DROP TABLE IF EXISTS active_deals CASCADE;

-- Create comprehensive deals table
CREATE TABLE IF NOT EXISTS active_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  npc_id uuid REFERENCES npcs(id) ON DELETE SET NULL,
  deal_type text NOT NULL CHECK (deal_type IN ('buy', 'sell', 'transport', 'protect')),
  item text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_per_unit integer NOT NULL DEFAULT 0,
  total_value integer NOT NULL DEFAULT 0,
  risk_level integer NOT NULL DEFAULT 5 CHECK (risk_level >= 1 AND risk_level <= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  start_day integer NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT 'Unknown',
  completion_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_deals_session ON active_deals(session_id);
CREATE INDEX IF NOT EXISTS idx_active_deals_npc ON active_deals(npc_id);
CREATE INDEX IF NOT EXISTS idx_active_deals_status ON active_deals(status);

-- Enable RLS
ALTER TABLE active_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to active_deals"
  ON active_deals FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to active_deals"
  ON active_deals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to active_deals"
  ON active_deals FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete from active_deals"
  ON active_deals FOR DELETE
  USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_active_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_active_deals_updated_at ON active_deals;
CREATE TRIGGER update_active_deals_updated_at
  BEFORE UPDATE ON active_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_active_deals_updated_at();