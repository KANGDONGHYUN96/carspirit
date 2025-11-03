-- 캐피탈 업체별 특이사항 테이블
CREATE TABLE company_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  product_types TEXT[] DEFAULT '{}',
  website_link TEXT,
  kakao_link TEXT,
  id_pw TEXT,
  email TEXT,
  fax TEXT,
  address TEXT,
  phone TEXT,
  delivery_company TEXT,
  construction_industry TEXT,
  insurance_change_after_contract TEXT,
  domestic_import_available TEXT,
  other_notice TEXT,
  liability_limit TEXT,
  rent_import_insurance_age TEXT,
  lease_pledge TEXT,
  deductible TEXT,
  license_guarantee TEXT,
  deposit_account TEXT,
  succession_fee TEXT,
  new_corporation TEXT,
  screening_funding TEXT,
  age_limit TEXT,
  overdue_interest_rate TEXT,
  foreigner TEXT,
  driver_range TEXT,
  mileage_excess TEXT,
  drunk_reacquired_under_1year TEXT,
  early_termination_penalty TEXT,
  family_driver_condition TEXT,
  total_loss TEXT,
  handling_restrictions TEXT,
  account_name_change TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업체 관련 파일 테이블
CREATE TABLE company_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_details(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 속도 향상)
CREATE INDEX idx_company_name ON company_details(company_name);
CREATE INDEX idx_company_files_company_id ON company_files(company_id);
CREATE INDEX idx_age_limit ON company_details USING gin(to_tsvector('simple', COALESCE(age_limit, '')));
CREATE INDEX idx_foreigner ON company_details(foreigner);

-- RLS (Row Level Security) 활성화
ALTER TABLE company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_files ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Anyone can read company details"
  ON company_details FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read company files"
  ON company_files FOR SELECT
  USING (true);

-- 인증된 사용자만 업체 정보 추가/수정 가능
CREATE POLICY "Authenticated users can insert company details"
  ON company_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update company details"
  ON company_details FOR UPDATE
  TO authenticated
  USING (true);

-- 인증된 사용자만 파일 업로드 가능
CREATE POLICY "Authenticated users can insert files"
  ON company_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_company_details_updated_at
  BEFORE UPDATE ON company_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
