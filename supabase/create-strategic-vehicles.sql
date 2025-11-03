-- 전략차종 관리 테이블 생성
CREATE TABLE IF NOT EXISTS strategic_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer TEXT NOT NULL,
  model_name TEXT NOT NULL,
  trim TEXT NOT NULL,
  vehicle_options TEXT,
  exterior_color TEXT,
  interior_color TEXT,
  price BIGINT NOT NULL DEFAULT 0,
  promotion_content TEXT,
  capital_logo TEXT,
  vehicle_image TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_strategic_vehicles_manufacturer ON strategic_vehicles(manufacturer);
CREATE INDEX IF NOT EXISTS idx_strategic_vehicles_model_name ON strategic_vehicles(model_name);
CREATE INDEX IF NOT EXISTS idx_strategic_vehicles_is_active ON strategic_vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_strategic_vehicles_created_at ON strategic_vehicles(created_at DESC);

-- RLS 활성화
ALTER TABLE strategic_vehicles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view strategic vehicles" ON strategic_vehicles;
DROP POLICY IF EXISTS "Users can insert strategic vehicles" ON strategic_vehicles;
DROP POLICY IF EXISTS "Users can update strategic vehicles" ON strategic_vehicles;
DROP POLICY IF EXISTS "Users can delete strategic vehicles" ON strategic_vehicles;

-- 인증된 사용자는 모두 조회 가능
CREATE POLICY "Users can view strategic vehicles"
  ON strategic_vehicles FOR SELECT
  TO authenticated
  USING (true);

-- 인증된 사용자는 모두 삽입 가능
CREATE POLICY "Users can insert strategic vehicles"
  ON strategic_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 인증된 사용자는 모두 수정 가능
CREATE POLICY "Users can update strategic vehicles"
  ON strategic_vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 인증된 사용자는 모두 삭제 가능
CREATE POLICY "Users can delete strategic vehicles"
  ON strategic_vehicles FOR DELETE
  TO authenticated
  USING (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_strategic_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_strategic_vehicles_updated_at ON strategic_vehicles;
CREATE TRIGGER trigger_update_strategic_vehicles_updated_at
  BEFORE UPDATE ON strategic_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_vehicles_updated_at();
