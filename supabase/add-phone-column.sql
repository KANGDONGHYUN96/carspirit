-- users 테이블에 phone 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 기존 사용자에게 테스트 전화번호 추가 (선택사항)
-- UPDATE users SET phone = '01012345678' WHERE phone IS NULL;
