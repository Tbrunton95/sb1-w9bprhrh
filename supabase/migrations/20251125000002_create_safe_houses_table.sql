/*
  # Create Safe Houses Table

  1. New Table: `safe_houses`
    - `id` (uuid, primary key)
    - `session_id` (uuid, foreign key to game_sessions)
    - `name` (text) - name of the property
    - `location` (text) - area in London
    - `property_type` (text) - 'penthouse', 'flat', 'warehouse', 'lockup', 'bedsit'
    - `ownership` (text) - 'owned', 'rented', 'squatting'
    - `monthly_cost` (integer) - rent/maintenance cost
    - `security_level` (integer) - 1-10, affects police raid chance
    - `storage_capacity` (integer) - how much can be stored (in units)
    - `heat_protection` (integer) - 1-10, how much it reduces heat when laying low
    - `is_primary` (boolean) - is this the main residence
    - `stored_cash` (integer) - cash hidden at this location
    - `stored_drugs` (jsonb) - drugs stashed here
    - `stored_weapons` (text[]) - weapons stored here
    - `features` (text[]) - special features like 'hidden_safe', 'panic_room', 'garage'
    - `description` (text) - narrative description
    - `discovered_by_police` (boolean) - if police know about this location
    - `last_visited` (integer) - game day when last visited
    - `metadata` (jsonb) - additional data
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Security
    - Enable RLS with open policies for development
*/

CREATE TABLE IF NOT EXISTS safe_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('penthouse', 'flat', 'warehouse', 'lockup', 'bedsit', 'house')),
  ownership text NOT NULL CHECK (ownership IN ('owned', 'rented', 'squatting', 'family')),
  monthly_cost integer DEFAULT 0,
  security_level integer DEFAULT 5 CHECK (security_level >= 1 AND security_level <= 10),
  storage_capacity integer DEFAULT 100,
  heat_protection integer DEFAULT 5 CHECK (heat_protection >= 1 AND heat_protection <= 10),
  is_primary boolean DEFAULT false,
  stored_cash integer DEFAULT 0,
  stored_drugs jsonb DEFAULT '{}',
  stored_weapons text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  description text,
  discovered_by_police boolean DEFAULT false,
  last_visited integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE safe_houses ENABLE ROW LEVEL SECURITY;

-- Open policy for development
CREATE POLICY "Allow all operations on safe_houses"
  ON safe_houses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_safe_houses_session_id ON safe_houses(session_id);
CREATE INDEX IF NOT EXISTS idx_safe_houses_location ON safe_houses(session_id, location);
CREATE INDEX IF NOT EXISTS idx_safe_houses_primary ON safe_houses(session_id, is_primary) WHERE is_primary = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_safe_houses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safe_houses_updated_at
  BEFORE UPDATE ON safe_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_safe_houses_updated_at();
