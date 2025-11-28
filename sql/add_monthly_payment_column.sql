-- contracts 테이블에 monthly_payment 컬럼 추가
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS monthly_payment INTEGER;

-- 컬럼 설명 추가
COMMENT ON COLUMN contracts.monthly_payment IS '월납입료';

-- contracts 테이블에 user_id 컬럼 추가
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS user_id UUID;

-- 기존 계약의 user_id를 created_by 값으로 업데이트
UPDATE contracts SET user_id = created_by WHERE user_id IS NULL;
