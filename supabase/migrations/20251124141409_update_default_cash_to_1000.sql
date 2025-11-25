/*
  # Update Default Cash Value

  1. Changes
    - Change default cash from 500 to 1000 in player_inventory table
    - This affects new game sessions only, existing inventories already updated

  2. Security
    - No security changes needed
*/

ALTER TABLE player_inventory 
ALTER COLUMN cash SET DEFAULT 1000;
