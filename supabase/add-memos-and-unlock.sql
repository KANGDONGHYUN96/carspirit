-- ============================================
-- 메모 기능 및 공개상태 추가
-- ============================================

-- 1. inquiry_memos 테이블 생성 (문의별 메모/댓글)
CREATE TABLE IF NOT EXISTS inquiry_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 메모 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiry_memos_inquiry_id ON inquiry_memos(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_memos_created_at ON inquiry_memos(created_at);

-- 2. inquiries 테이블에 unlock_at 컬럼 추가 (오픈DB 공개 예정 시간)
-- locked_at + 7일 = unlock_at (오픈DB에 다시 공개되는 시간)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMP WITH TIME ZONE;

-- 3. 기존 잠금된 데이터에 대해 unlock_at 계산
UPDATE inquiries
SET unlock_at = locked_at + INTERVAL '7 days'
WHERE locked_at IS NOT NULL AND locked_by IS NOT NULL AND unlock_at IS NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_inquiries_unlock_at ON inquiries(unlock_at);

-- ============================================
-- 실행 완료 후:
-- 1. 메모 기능 사용 가능
-- 2. 오픈DB 공개 카운트다운 표시 가능
-- ============================================
