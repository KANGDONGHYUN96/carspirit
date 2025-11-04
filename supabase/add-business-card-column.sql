-- users 테이블에 business_card_url과 admin_memo 컬럼 추가

-- 명함 이미지 URL 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_card_url TEXT;

-- 관리자 메모 컬럼 추가 (사용자 관리용)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_memo TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN users.business_card_url IS '사용자 명함 이미지 URL';
COMMENT ON COLUMN users.admin_memo IS '관리자 전용 메모 (사용자에게는 보이지 않음)';
