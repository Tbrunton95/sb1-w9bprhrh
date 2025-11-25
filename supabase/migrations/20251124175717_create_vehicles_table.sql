/*
  # Create Vehicles Table
  
  1. New Table: `vehicles`
    - `id` (uuid, primary key)
    - `session_id` (uuid, foreign key to game_sessions)
    - `vehicle_type` (text) - 'car', 'motorcycle', 'e-bike', 'moped'
    - `make_model` (text) - e.g., 'Audi A4', 'Honda CB500', 'Sur-Ron E-bike'
    - `registration` (text) - license plate number
    - `color` (text)
    - `fuel_level` (integer) - 0-100 percentage
    - `condition` (integer) - 0-100 percentage (maintenance state)
    - `is_stolen` (boolean) - whether vehicle has stolen plates/is hot
    - `is_active` (boolean) - currently being used
    - `parked_location` (text) - where it's currently parked
    - `storage_location` (text) - home garage/storage spot
    - `insurance_status` (text) - 'none', 'basic', 'full'
    - `modifications` (jsonb) - tracking upgrades like hidden compartments, engine mods
    - `metadata` (jsonb) - additional data like last service, miles, etc.
    - `purchase_price` (integer)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own vehicles
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'e-bike', 'moped', 'bicycle')),
  make_model text NOT NULL,
  registration text,
  color text NOT NULL,
  fuel_level integer DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  condition integer DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
  is_stolen boolean DEFAULT false,
  is_active boolean DEFAULT false,
  parked_location text,
  storage_location text,
  insurance_status text DEFAULT 'none' CHECK (insurance_status IN ('none', 'basic', 'full')),
  modifications jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  purchase_price integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own vehicles
CREATE POLICY "Users can view own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Policy: Users can insert their own vehicles
CREATE POLICY "Users can insert own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Policy: Users can update their own vehicles
CREATE POLICY "Users can update own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Policy: Users can delete their own vehicles
CREATE POLICY "Users can delete own vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_session_id ON vehicles(session_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(session_id, is_active) WHERE is_active = true;