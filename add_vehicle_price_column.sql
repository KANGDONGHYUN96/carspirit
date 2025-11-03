-- Add vehicle_price column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_price BIGINT;

-- Add customer_documents column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_documents TEXT;

-- Add comments to the columns
COMMENT ON COLUMN contracts.vehicle_price IS '차량가';
COMMENT ON COLUMN contracts.customer_documents IS '고객서류 URL';
