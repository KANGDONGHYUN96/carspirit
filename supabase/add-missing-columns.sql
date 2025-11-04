-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_card_url TEXT,
ADD COLUMN IF NOT EXISTS admin_memo TEXT;

-- Add columns to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS dealership TEXT,
ADD COLUMN IF NOT EXISTS media TEXT;
