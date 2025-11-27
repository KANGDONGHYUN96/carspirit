-- contracts 테이블에 새 컬럼 추가
-- 실행일: 2024

-- 기본정보 관련 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS funding_same BOOLEAN DEFAULT true;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS funding_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS funding_phone TEXT;

-- 차량정보 관련 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_options TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vehicle_price INTEGER;

-- 계약정보 관련 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sales_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_period TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS annual_mileage INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS initial_cost_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS initial_cost_amount INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insurance_age TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS car_tax_included TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_support TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_route TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS finance_company TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS dealer_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS manufacturer_dealer TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS dealership TEXT;

-- 수수료정보 관련 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS finance_commission INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS other_commission INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_support_amount INTEGER DEFAULT 0;

-- 파일 관련 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_documents TEXT;

-- 문의 연결 컬럼
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES inquiries(id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_contracts_inquiry_id ON contracts(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_contracts_birth_date ON contracts(birth_date);
