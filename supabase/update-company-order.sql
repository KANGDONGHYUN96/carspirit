-- 테이블에 display_order 컬럼 추가
ALTER TABLE company_details ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- 상품구분 수정
UPDATE company_details SET product_types = ARRAY['리스'] WHERE company_name = '롯데오토리스';
UPDATE company_details SET product_types = ARRAY['장기렌트'] WHERE company_name = '케이카캐피탈';
UPDATE company_details SET product_types = ARRAY['리스'] WHERE company_name = '산은캐피탈';

-- 카드 순서 설정 (display_order)
-- 1줄: 하나캐피탈 | KB캐피탈 | 우리금융캐피탈 | BNK캐피탈 | 오릭스캐피탈
UPDATE company_details SET display_order = 1 WHERE company_name = '하나캐피탈';
UPDATE company_details SET display_order = 2 WHERE company_name = 'KB캐피탈';
UPDATE company_details SET display_order = 3 WHERE company_name = '우리금융캐피탈';
UPDATE company_details SET display_order = 4 WHERE company_name = 'BNK캐피탈';
UPDATE company_details SET display_order = 5 WHERE company_name = '오릭스캐피탈';

-- 2줄: IM캐피탈 | 메리츠캐피탈 | 롯데캐피탈 | 롯데렌트카 | 신한카드
UPDATE company_details SET display_order = 6 WHERE company_name = 'IM캐피탈';
UPDATE company_details SET display_order = 7 WHERE company_name = '메리츠캐피탈';
UPDATE company_details SET display_order = 8 WHERE company_name = '롯데캐피탈';
UPDATE company_details SET display_order = 9 WHERE company_name = '롯데렌트카';
UPDATE company_details SET display_order = 10 WHERE company_name = '신한카드';

-- 3줄: JB우리캐피탈 | 농협캐피탈 | 현대캐피탈 | 삼성카드 | 케이카캐피탈
UPDATE company_details SET display_order = 11 WHERE company_name = 'JB우리캐피탈';
UPDATE company_details SET display_order = 12 WHERE company_name = '농협캐피탈';
UPDATE company_details SET display_order = 13 WHERE company_name = '현대캐피탈';
UPDATE company_details SET display_order = 14 WHERE company_name = '삼성카드';
UPDATE company_details SET display_order = 15 WHERE company_name = '케이카캐피탈';

-- 4줄: SK렌터카 | 산은캐피탈 | 우리카드 | 롯데오토리스 | MG캐피탈
UPDATE company_details SET display_order = 16 WHERE company_name = 'SK렌터카';
UPDATE company_details SET display_order = 17 WHERE company_name = '산은캐피탈';
UPDATE company_details SET display_order = 18 WHERE company_name = '우리카드';
UPDATE company_details SET display_order = 19 WHERE company_name = '롯데오토리스';
UPDATE company_details SET display_order = 20 WHERE company_name = 'MG캐피탈';

-- 확인
SELECT company_name, product_types, display_order
FROM company_details
ORDER BY display_order;
