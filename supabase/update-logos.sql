-- 업체별 로고 URL 업데이트 (전체)
UPDATE company_details SET logo_url = '/company-logos/bnk.png' WHERE company_name = 'BNK캐피탈';
UPDATE company_details SET logo_url = '/company-logos/hana.png' WHERE company_name = '하나캐피탈';
UPDATE company_details SET logo_url = '/company-logos/hyundai-capital.png' WHERE company_name = '현대캐피탈';
UPDATE company_details SET logo_url = '/company-logos/im.png' WHERE company_name = 'IM캐피탈';
UPDATE company_details SET logo_url = '/company-logos/jb.png' WHERE company_name = 'JB우리캐피탈';
UPDATE company_details SET logo_url = '/company-logos/kb.png' WHERE company_name = 'KB캐피탈';
UPDATE company_details SET logo_url = '/company-logos/kcar.png' WHERE company_name = '케이카캐피탈';
UPDATE company_details SET logo_url = '/company-logos/kdb.png' WHERE company_name = '산은캐피탈';
UPDATE company_details SET logo_url = '/company-logos/lotte-auto.png' WHERE company_name = '롯데오토리스';
UPDATE company_details SET logo_url = '/company-logos/lotte-capital.png' WHERE company_name = '롯데캐피탈';
UPDATE company_details SET logo_url = '/company-logos/lotte-rent.png' WHERE company_name = '롯데렌트카';
UPDATE company_details SET logo_url = '/company-logos/meritz.png' WHERE company_name = '메리츠캐피탈';
UPDATE company_details SET logo_url = '/company-logos/mg.png' WHERE company_name = 'MG캐피탈';
UPDATE company_details SET logo_url = '/company-logos/nh.png' WHERE company_name = '농협캐피탈';
UPDATE company_details SET logo_url = '/company-logos/orix.png' WHERE company_name = '오릭스캐피탈';
UPDATE company_details SET logo_url = '/company-logos/samsung.png' WHERE company_name = '삼성카드';
UPDATE company_details SET logo_url = '/company-logos/shinhan.png' WHERE company_name = '신한카드';
UPDATE company_details SET logo_url = '/company-logos/sk.png' WHERE company_name = 'SK렌터카';
UPDATE company_details SET logo_url = '/company-logos/woori.png' WHERE company_name = '우리금융캐피탈';
UPDATE company_details SET logo_url = '/company-logos/wooricard.png' WHERE company_name = '우리카드';

-- 업데이트 확인
SELECT company_name, logo_url FROM company_details ORDER BY company_name;
