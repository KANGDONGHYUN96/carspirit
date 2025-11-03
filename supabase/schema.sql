-- ============================================
-- CarSpirit 관리시스템 데이터베이스 스키마
-- ============================================

-- 1. Users 테이블 (사용자 정보 및 권한 관리)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'salesperson' CHECK (role IN ('salesperson', 'manager', 'admin')),
  approved BOOLEAN DEFAULT false,
  allowed_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Capital Promotions 테이블 (캐피탈별 지원금/프로모션)
CREATE TABLE IF NOT EXISTS capital_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capital TEXT NOT NULL,
  title TEXT NOT NULL,
  support_amount INTEGER NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 3. Strategic Models 테이블 (전략차종)
CREATE TABLE IF NOT EXISTS strategic_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name TEXT NOT NULL,
  trim TEXT NOT NULL,
  brand TEXT NOT NULL,
  capital TEXT NOT NULL,
  reason TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 4. Inquiries 테이블 (고객문의)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stock List 테이블 (즉시출고 차량)
CREATE TABLE IF NOT EXISTS stock_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  price INTEGER NOT NULL,
  promo TEXT,
  capital TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'reserved', 'sold')),
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Chatbot Logs 테이블 (상담로그)
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  message TEXT NOT NULL,
  ai_response TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Contracts 테이블 (계약관리)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  vehicle_name TEXT NOT NULL,
  vehicle_trim TEXT,
  brand TEXT NOT NULL,
  capital TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('rent', 'lease')),
  amount INTEGER NOT NULL,
  commission INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  contract_date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Logs 테이블 (수정이력)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_capital_promotions_status ON capital_promotions(status);
CREATE INDEX IF NOT EXISTS idx_strategic_models_status ON strategic_models(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_table_name ON logs(table_name);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- Users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 정보만 조회 가능" ON users
  FOR SELECT USING (auth.uid() = auth_user_id OR EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "관리자만 사용자 정보 수정 가능" ON users
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

-- Inquiries 테이블 RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 문의만 조회 가능" ON inquiries
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "사용자는 자신의 문의만 생성 가능" ON inquiries
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "배정된 사용자만 문의 수정 가능" ON inquiries
  FOR UPDATE USING (
    assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Contracts 테이블 RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 계약만 조회 가능" ON contracts
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "사용자는 자신의 계약만 생성 가능" ON contracts
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "사용자는 자신의 계약만 수정 가능" ON contracts
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Chatbot Logs 테이블 RLS
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 챗봇 로그만 조회 가능" ON chatbot_logs
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- 공개 데이터 테이블 (인증된 사용자 모두 접근 가능)
ALTER TABLE capital_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증된 사용자는 모든 프로모션 조회 가능" ON capital_promotions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "관리자만 프로모션 수정 가능" ON capital_promotions
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'));

ALTER TABLE strategic_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증된 사용자는 모든 전략차종 조회 가능" ON strategic_models
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "관리자/매니저만 전략차종 수정 가능" ON strategic_models
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')));

ALTER TABLE stock_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증된 사용자는 모든 재고 조회 가능" ON stock_list
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 트리거 함수 (자동 updated_at 갱신)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_capital_promotions_updated_at BEFORE UPDATE ON capital_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategic_models_updated_at BEFORE UPDATE ON strategic_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_list_updated_at BEFORE UPDATE ON stock_list
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 로그 기록 트리거 함수
-- ============================================

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    (SELECT id FROM users WHERE auth_user_id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 중요 테이블에 로그 트리거 적용
CREATE TRIGGER log_contracts_changes AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER log_users_changes AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_changes();
