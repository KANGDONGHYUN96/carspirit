-- 캐피탈 프로모션 테이블 생성
CREATE TABLE IF NOT EXISTS capital_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  discount_rate TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 전략차종 테이블 생성
CREATE TABLE IF NOT EXISTS strategic_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  image_url TEXT,
  monthly_price TEXT,
  highlight TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_capital_promotions_active ON capital_promotions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_strategic_models_active ON strategic_models(is_active, display_order);
