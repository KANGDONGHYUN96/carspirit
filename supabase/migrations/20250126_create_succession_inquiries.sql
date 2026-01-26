-- 승계문의 테이블 생성 (admin 전용)
CREATE TABLE IF NOT EXISTS succession_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '신규',
  memo TEXT,
  source TEXT DEFAULT '승계',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 (admin만 접근 가능)
ALTER TABLE succession_inquiries ENABLE ROW LEVEL SECURITY;

-- Admin만 조회 가능
CREATE POLICY "Admin can view succession_inquiries" ON succession_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin만 수정 가능
CREATE POLICY "Admin can update succession_inquiries" ON succession_inquiries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin만 삭제 가능
CREATE POLICY "Admin can delete succession_inquiries" ON succession_inquiries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service Role은 INSERT 가능 (외부 API용)
-- INSERT는 RLS 없이 Service Role Key로만 수행

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_succession_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_succession_inquiries_updated_at
  BEFORE UPDATE ON succession_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_succession_inquiries_updated_at();

-- 승계문의 메모 테이블
CREATE TABLE IF NOT EXISTS succession_inquiry_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES succession_inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메모 테이블 RLS
ALTER TABLE succession_inquiry_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage succession_inquiry_memos" ON succession_inquiry_memos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );
