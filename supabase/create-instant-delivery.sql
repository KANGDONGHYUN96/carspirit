-- ============================================
-- 즉시출고 차량 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS instant_delivery_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 차량 기본 정보
  source TEXT NOT NULL,              -- 출처 (캐피탈사)
  vehicle_name TEXT NOT NULL,        -- 차량명
  options TEXT,                      -- 옵션
  exterior_color TEXT,               -- 외장색
  interior_color TEXT,               -- 내장색
  price BIGINT,                      -- 차량가
  promotion TEXT,                    -- 프로모션
  product_type TEXT,                 -- 상품구분 (리스/렌트 등)
  note TEXT,                         -- 비고

  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- 검색 최적화를 위한 인덱스
  CONSTRAINT instant_delivery_vehicles_source_check
    CHECK (source IN (
      'BNK캐피탈', 'JB우리캐피탈', '기아', '농협캐피탈', '롯데캐피탈',
      '롯데렌터카', '현대캐피탈', '현대', '우리금융캐피탈', '오릭스캐피탈',
      'KB캐피탈', '신한카드', 'IM캐피탈', 'MG캐피탈', 'SK렌터카'
    ))
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_instant_delivery_source ON instant_delivery_vehicles(source);
CREATE INDEX IF NOT EXISTS idx_instant_delivery_vehicle_name ON instant_delivery_vehicles(vehicle_name);
CREATE INDEX IF NOT EXISTS idx_instant_delivery_created_at ON instant_delivery_vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instant_delivery_price ON instant_delivery_vehicles(price);

-- 전체 텍스트 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_instant_delivery_search
  ON instant_delivery_vehicles
  USING GIN (to_tsvector('simple',
    COALESCE(vehicle_name, '') || ' ' ||
    COALESCE(options, '') || ' ' ||
    COALESCE(exterior_color, '') || ' ' ||
    COALESCE(interior_color, '') || ' ' ||
    COALESCE(promotion, '') || ' ' ||
    COALESCE(note, '')
  ));

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

INSERT INTO instant_delivery_vehicles (
  source, vehicle_name, options, exterior_color, interior_color,
  price, promotion, product_type, note
) VALUES
  ('현대캐피탈', '그랜저', '이그제큐티브', '크리미화이트펄', '블랙', 45000000, '추가지원 200만원', '장기렌트', '즉시출고 가능'),
  ('기아', 'K8', '프리미엄', '스노우화이트펄', '블랙', 42000000, '프로모션 150만원', '장기렌트', '재고차량'),
  ('롯데캐피탈', '쏘나타', 'N라인', '문라이트블루', '블랙', 35000000, NULL, '장기렌트', '빠른출고'),
  ('현대', '아이오닉5', '롱레인지', '디지털틸그린펄', '그린', 52000000, '정부보조금 지원', '리스', '전기차'),
  ('KB캐피탈', '카니발', '시그니처', '스노우화이트펄', '블랙', 48000000, NULL, '장기렌트', '가족용 추천'),
  ('농협캐피탈', '싼타페', '칼리그래피', '문라이트클라우드마이카', '블랙', 46000000, '추가지원 100만원', '리스', '인기차량'),
  ('JB우리캐피탈', '팰리세이드', 'VIP', '크리미화이트펄', '블랙', 55000000, NULL, '장기렌트', '프리미엄 SUV');

-- ============================================
-- 실행 완료 후:
-- 1. 즉시출고 차량 관리 가능
-- 2. 검색 및 필터링 기능 사용 가능
-- ============================================
