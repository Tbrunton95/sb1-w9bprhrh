/*
  # Add Temporal and Weather Tracking to Game Sessions

  1. Changes
    - Add `day_of_week` (text) - Day name like "Monday", "Tuesday"
    - Add `month` (integer) - Month number 1-12
    - Add `year` (integer) - Year number
    - Add `season` (text) - Season like "Winter", "Spring", "Summer", "Autumn"
    - Add `weather` (text) - Current weather conditions
    - Add `temperature` (integer) - Temperature in Celsius

  2. Default Values
    - day_of_week: 'Monday' (start of first week)
    - month: 11 (November)
    - year: 2024
    - season: 'Autumn' (November is autumn in UK)
    - weather: 'Overcast' (typical London weather)
    - temperature: 12 (typical November London temp in Celsius)

  3. Security
    - No RLS changes needed (uses existing session policies)
*/

-- Add temporal and weather tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'day_of_week'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN day_of_week text DEFAULT 'Monday';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'month'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN month integer DEFAULT 11;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'year'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN year integer DEFAULT 2024;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'season'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN season text DEFAULT 'Autumn';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'weather'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN weather text DEFAULT 'Overcast';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'temperature'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN temperature integer DEFAULT 12;
  END IF;
END $$;

-- Update existing sessions to have temporal data
UPDATE game_sessions 
SET 
  day_of_week = 'Monday',
  month = 11,
  year = 2024,
  season = 'Autumn',
  weather = 'Overcast',
  temperature = 12
WHERE day_of_week IS NULL;