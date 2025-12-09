-- 사용자 테이블에 확장 필드 추가
-- 인적사항: fax
-- 회사/업무 정보: company, position, join_date, recruiter_number
-- 정산계좌: bank_name, account_holder, account_number

ALTER TABLE users ADD COLUMN IF NOT EXISTS fax TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recruiter_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number TEXT;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
CREATE INDEX IF NOT EXISTS idx_users_recruiter_number ON users(recruiter_number);
