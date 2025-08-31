-- Create payment_methods table if it doesn't exist
-- This migration ensures the payment_methods table exists with all required fields

-- Create the payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  description TEXT,
  icon VARCHAR(100),
  requires_confirmation BOOLEAN DEFAULT false,
  auto_assign_package BOOLEAN DEFAULT true,
  currency_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if currencies table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') THEN
    BEGIN
      ALTER TABLE payment_methods 
      ADD CONSTRAINT fk_payment_methods_currency 
      FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
    END;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_name ON payment_methods(name);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_currency ON payment_methods(currency_id);

-- Enable Row Level Security (RLS)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Add comment to document the table structure
COMMENT ON TABLE payment_methods IS 'Payment methods configuration table with support for various payment types and settings';

-- Insert some default payment methods if the table is empty
INSERT INTO payment_methods (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Cash', 'cash', 'Cash payment', '💵', false, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'Cash');

INSERT INTO payment_methods (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Bank Transfer', 'bank_transfer', 'Bank transfer payment', '🏦', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'Bank Transfer');

INSERT INTO payment_methods (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Credit Card', 'credit_card', 'Credit card payment', '💳', false, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = 'Credit Card');
