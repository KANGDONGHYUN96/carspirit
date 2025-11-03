-- 기존 테이블 삭제하고 새로 생성
DROP TABLE IF EXISTS capital_promotions CASCADE;

-- 프로모션 테이블 재생성
CREATE TABLE capital_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capital TEXT NOT NULL,
  rent_promotion TEXT,
  lease_promotion TEXT,
  strategic_models TEXT,
  conditions TEXT,
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_capital_promotions_status ON capital_promotions(status);
CREATE INDEX IF NOT EXISTS idx_capital_promotions_dates ON capital_promotions(start_date, end_date);

-- RLS 정책
ALTER TABLE capital_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view promotions" ON capital_promotions;
CREATE POLICY "Anyone can view promotions"
  ON capital_promotions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON capital_promotions;
CREATE POLICY "Authenticated users can insert promotions"
  ON capital_promotions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update promotions" ON capital_promotions;
CREATE POLICY "Authenticated users can update promotions"
  ON capital_promotions FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete promotions" ON capital_promotions;
CREATE POLICY "Authenticated users can delete promotions"
  ON capital_promotions FOR DELETE
  USING (auth.role() = 'authenticated');
