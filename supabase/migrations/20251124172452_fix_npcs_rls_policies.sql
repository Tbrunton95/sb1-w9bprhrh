/*
  # Fix NPCs RLS Policies

  1. Changes
    - Add INSERT policy for npcs table to allow authenticated users to create NPCs
    - Add UPDATE policy for npcs table to allow authenticated users to update NPCs
    - Add DELETE policy for npcs table to allow authenticated users to delete NPCs
  
  2. Security
    - Policies restricted to authenticated users only
    - Maintains existing SELECT policy for public read access
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated insert to npcs" ON npcs;
DROP POLICY IF EXISTS "Allow authenticated update to npcs" ON npcs;
DROP POLICY IF EXISTS "Allow authenticated delete to npcs" ON npcs;

-- Allow authenticated users to insert NPCs
CREATE POLICY "Allow authenticated insert to npcs"
  ON npcs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update NPCs
CREATE POLICY "Allow authenticated update to npcs"
  ON npcs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete NPCs
CREATE POLICY "Allow authenticated delete to npcs"
  ON npcs
  FOR DELETE
  TO authenticated
  USING (true);