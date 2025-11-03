-- 나머지 16개 업체 추가 (기본 정보만)

-- BNK캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('BNK캐피탈', '/company-logos/bnk.png', ARRAY['장기렌트', '리스']);

-- 하나캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('하나캐피탈', '/company-logos/hana.png', ARRAY['장기렌트', '리스']);

-- 현대캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('현대캐피탈', '/company-logos/hyundai-capital.png', ARRAY['장기렌트', '리스']);

-- IM캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('IM캐피탈', '/company-logos/im.png', ARRAY['장기렌트', '리스']);

-- JB우리캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('JB우리캐피탈', '/company-logos/jb.png', ARRAY['장기렌트', '리스']);

-- 케이카캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('케이카캐피탈', '/company-logos/kcar.png', ARRAY['장기렌트', '리스']);

-- 산은캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('산은캐피탈', '/company-logos/kdb.png', ARRAY['장기렌트', '리스']);

-- 롯데오토리스
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('롯데오토리스', '/company-logos/lotte-auto.png', ARRAY['장기렌트']);

-- 롯데캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('롯데캐피탈', '/company-logos/lotte-capital.png', ARRAY['장기렌트', '리스']);

-- 롯데렌트카
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('롯데렌트카', '/company-logos/lotte-rent.png', ARRAY['장기렌트']);

-- MG캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('MG캐피탈', '/company-logos/mg.png', ARRAY['장기렌트', '리스']);

-- 농협캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('농협캐피탈', '/company-logos/nh.png', ARRAY['장기렌트', '리스']);

-- 오릭스캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('오릭스캐피탈', '/company-logos/orix.png', ARRAY['장기렌트', '리스']);

-- 삼성카드
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('삼성카드', '/company-logos/samsung.png', ARRAY['장기렌트', '리스']);

-- SK렌터카
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('SK렌터카', '/company-logos/sk.png', ARRAY['장기렌트']);

-- 우리금융캐피탈
INSERT INTO company_details (company_name, logo_url, product_types)
VALUES ('우리금융캐피탈', '/company-logos/woori.png', ARRAY['장기렌트', '리스']);

-- 업체 확인
SELECT company_name, logo_url, product_types FROM company_details ORDER BY company_name;
