-- 로테이션 시스템 테이블 생성

-- 1. 영업자 로테이션 설정 테이블
CREATE TABLE IF NOT EXISTS user_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,  -- 로테이션 배분 활성화 여부
  priority INT DEFAULT 1,           -- 우선순위 (1-10, 높을수록 더 많이 배분)
  last_assigned_at TIMESTAMPTZ,     -- 마지막 배정 시간
  total_assigned_count INT DEFAULT 0,   -- 총 배정 개수
  today_assigned_count INT DEFAULT 0,   -- 오늘 배정 개수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 로테이션 상태 테이블 (라운드 로빈용)
CREATE TABLE IF NOT EXISTS rotation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_index INT DEFAULT 0,  -- 현재 순서 인덱스
  last_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 마지막 배정된 영업자
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 rotation_state 레코드 생성 (하나만 존재)
INSERT INTO rotation_state (id, current_index)
VALUES (gen_random_uuid(), 0)
ON CONFLICT DO NOTHING;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_rotation_active ON user_rotation(is_active);
CREATE INDEX IF NOT EXISTS idx_user_rotation_priority ON user_rotation(priority DESC);
CREATE INDEX IF NOT EXISTS idx_user_rotation_today_count ON user_rotation(today_assigned_count);

-- 4. RLS 정책
ALTER TABLE user_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_state ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "모든 인증된 사용자가 로테이션 설정 조회" ON user_rotation;
DROP POLICY IF EXISTS "관리자만 로테이션 설정 수정" ON user_rotation;
DROP POLICY IF EXISTS "모든 인증된 사용자가 로테이션 상태 조회" ON rotation_state;
DROP POLICY IF EXISTS "시스템만 로테이션 상태 수정" ON rotation_state;
DROP POLICY IF EXISTS "API에서 로테이션 설정 조회" ON user_rotation;
DROP POLICY IF EXISTS "API에서 로테이션 설정 수정" ON user_rotation;
DROP POLICY IF EXISTS "API에서 로테이션 상태 조회" ON rotation_state;
DROP POLICY IF EXISTS "API에서 로테이션 상태 수정" ON rotation_state;

-- 인증된 사용자가 조회 가능
CREATE POLICY "모든 인증된 사용자가 로테이션 설정 조회" ON user_rotation
  FOR SELECT
  TO authenticated
  USING (true);

-- API (anon)에서도 조회 가능 (문의 접수 API용)
CREATE POLICY "API에서 로테이션 설정 조회" ON user_rotation
  FOR SELECT
  TO anon
  USING (true);

-- 관리자만 수정 가능
CREATE POLICY "관리자만 로테이션 설정 수정" ON user_rotation
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- API (anon)에서 로테이션 설정 수정 가능 (카운트 업데이트용)
CREATE POLICY "API에서 로테이션 설정 수정" ON user_rotation
  FOR UPDATE
  TO anon
  USING (true);

-- rotation_state는 인증된 사용자가 조회 가능
CREATE POLICY "모든 인증된 사용자가 로테이션 상태 조회" ON rotation_state
  FOR SELECT
  TO authenticated
  USING (true);

-- API (anon)에서도 조회 가능
CREATE POLICY "API에서 로테이션 상태 조회" ON rotation_state
  FOR SELECT
  TO anon
  USING (true);

-- rotation_state는 인증된 사용자가 업데이트 가능
CREATE POLICY "시스템만 로테이션 상태 수정" ON rotation_state
  FOR UPDATE
  TO authenticated
  USING (true);

-- API (anon)에서도 업데이트 가능
CREATE POLICY "API에서 로테이션 상태 수정" ON rotation_state
  FOR UPDATE
  TO anon
  USING (true);

-- 5. 기존 영업자들을 user_rotation에 자동 추가
INSERT INTO user_rotation (user_id, is_active, priority)
SELECT id, true, 1
FROM users
WHERE role = 'salesperson' AND approved = true
ON CONFLICT (user_id) DO NOTHING;
