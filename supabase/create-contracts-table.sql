-- 기존 테이블 삭제
DROP TABLE IF EXISTS contracts CASCADE;

-- 계약관리 테이블 생성
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  media TEXT,
  phone TEXT,
  contractor TEXT,
  capital TEXT,
  vehicle_name TEXT,
  product_type TEXT,
  delivery_type TEXT,
  ag_commission INTEGER DEFAULT 0,
  capital_commission INTEGER DEFAULT 0,
  dealer_commission INTEGER DEFAULT 0,
  payback INTEGER DEFAULT 0,
  total_commission INTEGER DEFAULT 0,
  settlement_amount INTEGER DEFAULT 0,
  contract_date DATE,
  execution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_name ON contracts(customer_name);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);

-- RLS 정책
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own contracts" ON contracts;
CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;
CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (auth.role() = 'authenticated');
