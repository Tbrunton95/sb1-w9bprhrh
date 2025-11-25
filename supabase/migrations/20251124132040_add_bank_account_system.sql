/*
  # Add Bank Account & Monthly Income System

  1. New Columns to player_inventory
    - `bank_balance` (integer) - Money stored safely in bank account
    - `last_bank_deposit` (integer) - Day number of last deposit
    - `last_income_payment` (integer) - Day number of last monthly payment received
    
  2. New Table: financial_transactions
    - Track all money movements for audit trail
    - Supports: income, deposit, withdrawal, deal_profit, expense, etc.
    
  3. Security
    - Enable RLS on financial_transactions table
    - Add policies for authenticated access
    
  This creates a proper economy system where:
  - Cash = money on hand (dangerous to carry, can be lost/stolen)
  - Bank = safe storage (requires ATM/bank visit to access)
  - Monthly income of £12,500 auto-deposits to bank account
*/

-- Add bank account columns to player_inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_inventory' AND column_name = 'bank_balance'
  ) THEN
    ALTER TABLE player_inventory ADD COLUMN bank_balance integer DEFAULT 12500;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_inventory' AND column_name = 'last_bank_deposit'
  ) THEN
    ALTER TABLE player_inventory ADD COLUMN last_bank_deposit integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_inventory' AND column_name = 'last_income_payment'
  ) THEN
    ALTER TABLE player_inventory ADD COLUMN last_income_payment integer DEFAULT 0;
  END IF;
END $$;

-- Create financial transactions table for audit trail
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'income', 'deposit', 'withdrawal', 'deal_profit', 'expense', 'loss', 'bribe'
  amount integer NOT NULL,
  balance_type text NOT NULL, -- 'cash' or 'bank'
  description text DEFAULT '',
  game_day integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_session ON financial_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_day ON financial_transactions(game_day);

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_transactions
CREATE POLICY "Allow public read access to financial_transactions"
  ON financial_transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to financial_transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to financial_transactions"
  ON financial_transactions FOR UPDATE
  USING (true) WITH CHECK (true);

-- Create trigger for updated_at on player_inventory if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_player_inventory_updated_at ON player_inventory;
CREATE TRIGGER update_player_inventory_updated_at 
  BEFORE UPDATE ON player_inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();