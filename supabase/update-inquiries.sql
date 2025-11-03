-- Inquiries 테이블 수정
-- 1. source 컬럼 추가 (매체)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT '카스피릿';

-- 2. status 값 변경 (기존 데이터 마이그레이션)
-- 먼저 CHECK 제약조건 삭제
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;

-- 기존 데이터 변환
UPDATE inquiries SET status = '신규' WHERE status = 'new';
UPDATE inquiries SET status = '관리' WHERE status = 'in_progress';
UPDATE inquiries SET status = '계약' WHERE status = 'completed';
UPDATE inquiries SET status = '계약' WHERE status = 'cancelled';

-- 새로운 CHECK 제약조건 추가
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('신규', '관리', '부재', '심사', '가망', '계약'));

-- 3. status 기본값 변경
ALTER TABLE inquiries ALTER COLUMN status SET DEFAULT '신규';

-- 4. assigned_to_name 컬럼 추가 (담당자 이름)
-- user_id로 조인하지 않고 직접 이름 저장
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

-- 5. 오픈DB 잠금 기능을 위한 컬럼 추가
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_locked_at ON inquiries(locked_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
