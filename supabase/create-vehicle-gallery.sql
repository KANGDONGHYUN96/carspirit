-- 출고 사진 갤러리 테이블 생성
CREATE TABLE IF NOT EXISTS vehicle_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,

  -- 차량 정보
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  exterior_color TEXT,
  interior_color TEXT,
  options TEXT,

  -- 파일
  thumbnail_url TEXT NOT NULL,
  zip_file_url TEXT NOT NULL,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vehicle_gallery_created_at ON vehicle_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_gallery_user_id ON vehicle_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_gallery_brand ON vehicle_gallery(brand);

-- RLS 정책
ALTER TABLE vehicle_gallery ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Anyone can view vehicle gallery" ON vehicle_gallery;
DROP POLICY IF EXISTS "Users can insert their own vehicle gallery" ON vehicle_gallery;
DROP POLICY IF EXISTS "Users can update their own vehicle gallery" ON vehicle_gallery;
DROP POLICY IF EXISTS "Users can delete their own vehicle gallery" ON vehicle_gallery;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone can view vehicle gallery"
  ON vehicle_gallery
  FOR SELECT
  TO authenticated
  USING (true);

-- 인증된 사용자는 자신의 항목 생성 가능
CREATE POLICY "Users can insert their own vehicle gallery"
  ON vehicle_gallery
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 본인 또는 관리자만 수정 가능
CREATE POLICY "Users can update their own vehicle gallery"
  ON vehicle_gallery
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 본인 또는 관리자만 삭제 가능
CREATE POLICY "Users can delete their own vehicle gallery"
  ON vehicle_gallery
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );
