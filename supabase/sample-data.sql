-- ============================================
-- CarSpirit 샘플 데이터
-- ============================================

-- 캐피탈 프로모션 샘플 데이터
INSERT INTO capital_promotions (capital, title, support_amount, description, start_date, end_date, status, created_by) VALUES
('KB캐피탈', '신차 구매 특별 금리 이벤트', 300, 'KB캐피탈 신차 구매 시 최대 300만원 지원금 제공', '2025-10-01', '2025-12-31', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('현대캐피탈', '연말 특별 프로모션', 500, '현대차/기아차 구매 시 최대 500만원 지원', '2025-10-15', '2025-12-31', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('롯데캐피탈', '수입차 특별 할인', 400, '수입차 구매 고객 대상 400만원 지원', '2025-10-01', '2025-11-30', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('신한캐피탈', '전기차 지원 프로그램', 600, '친환경 전기차 구매 시 최대 600만원 혜택', '2025-09-01', '2025-12-31', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('하나캐피탈', '가을맞이 특별 프로모션', 350, '가을 시즌 특별 금리 및 지원금 혜택', '2025-09-15', '2025-11-15', 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- 전략차종 샘플 데이터
INSERT INTO strategic_models (vehicle_name, trim, brand, capital, reason, display_order, status, created_by) VALUES
('그랜저', '캘리그래피', '현대', 'KB캐피탈', '인기 모델로 높은 수요, 우수한 잔가율', 1, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('카니발', '시그니처', 'KIA', '현대캐피탈', '패밀리카 최고 인기, 안정적인 판매', 2, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('소렌토', '디젤 4WD', 'KIA', '롯데캐피탈', 'SUV 인기 모델, 실용성 우수', 3, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('아이오닉6', '롱레인지', '현대', '신한캐피탈', '전기차 보조금 대상, 높은 관심도', 4, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('G80', '3.5 터보', '제네시스', 'KB캐피탈', '프리미엄 세단, 안정적인 수요', 5, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('팰리세이드', '캘리그래피', '현대', '하나캐피탈', '대형 SUV 베스트셀러', 6, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('EV6', 'GT-Line', 'KIA', '신한캐피탈', '전기차 인기 모델, 디자인 우수', 7, 'active', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- 즉시출고 차량 샘플 데이터
INSERT INTO stock_list (brand, model, trim, year, color, price, promo, capital, availability, location) VALUES
('현대', '그랜저', '캘리그래피', 2025, '퍼플그레이', 4200, 'KB 300만원', 'KB캐피탈', 'available', '서울 강남'),
('KIA', '카니발', '시그니처', 2025, '스노우펄', 4500, '현대캐피탈 500만원', '현대캐피탈', 'available', '경기 수원'),
('현대', '아이오닉6', '롱레인지', 2024, '사이버그레이', 5200, '신한 600만원', '신한캐피탈', 'available', '서울 송파'),
('제네시스', 'G80', '3.5 터보', 2025, '어비스블랙', 6800, 'KB 300만원', 'KB캐피탈', 'available', '서울 강남'),
('KIA', '소렌토', '디젤 4WD', 2025, '스노우펄', 4100, '롯데 400만원', '롯데캐피탈', 'reserved', '경기 일산'),
('현대', '팰리세이드', '캘리그래피', 2025, '문라이트클라우드', 4900, '하나 350만원', '하나캐피탈', 'available', '인천'),
('KIA', 'EV6', 'GT-Line', 2024, '오로라블랙', 5800, '신한 600만원', '신한캐피탈', 'available', '서울 서초');

-- 샘플 계약 데이터 (현재 달)
INSERT INTO contracts (user_id, customer_name, customer_phone, vehicle_name, vehicle_trim, brand, capital, contract_type, amount, commission, status, contract_date) VALUES
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '김철수', '010-1234-5678', '그랜저', '캘리그래피', '현대', 'KB캐피탈', 'rent', 4200, 150, 'completed', '2025-10-15'),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '이영희', '010-2345-6789', '카니발', '시그니처', 'KIA', '현대캐피탈', 'lease', 4500, 180, 'approved', '2025-10-20'),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '박민수', '010-3456-7890', 'G80', '3.5 터보', '제네시스', 'KB캐피탈', 'rent', 6800, 250, 'pending', '2025-10-25');

-- 샘플 문의 데이터
INSERT INTO inquiries (user_id, customer_name, customer_phone, customer_email, content, status, assigned_to) VALUES
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '최지훈', '010-4567-8901', 'choi@example.com', '그랜저 하이브리드 출고 기간 문의드립니다.', 'new', (SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com')),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '정수진', '010-5678-9012', 'jung@example.com', '아이오닉6 시승 가능한가요?', 'in_progress', (SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com')),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '강민재', '010-6789-0123', 'kang@example.com', '팰리세이드 캘리그래피 견적 부탁드립니다.', 'new', (SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'));

-- 샘플 챗봇 로그
INSERT INTO chatbot_logs (user_id, customer_name, customer_phone, message, ai_response, rating) VALUES
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '송하늘', '010-7890-1234', '그랜저 가격이 어떻게 되나요?', '그랜저 캘리그래피 모델은 약 4,200만원부터 시작합니다. 자세한 상담을 원하시면 연결해드리겠습니다.', 5),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '윤서연', '010-8901-2345', '전기차 보조금은 얼마나 받을 수 있나요?', '아이오닉6 기준으로 국고보조금 약 450만원, 지자체 보조금 포함 최대 700만원까지 지원받으실 수 있습니다.', 4),
((SELECT id FROM users WHERE email = 'rkdzld5722@gmail.com'), '임준혁', '010-9012-3456', '즉시 출고 가능한 차량 알려주세요', '현재 즉시 출고 가능한 차량은 그랜저, 카니발, 아이오닉6 등이 있습니다. 원하시는 차종을 말씀해주시면 자세히 안내드리겠습니다.', 5);
