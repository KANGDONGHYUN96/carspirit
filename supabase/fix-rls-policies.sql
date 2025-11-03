-- 기존 users 테이블 정책 삭제
DROP POLICY IF EXISTS "사용자는 자신의 정보만 조회 가능" ON users;
DROP POLICY IF EXISTS "관리자만 사용자 정보 수정 가능" ON users;
DROP POLICY IF EXISTS "신규 사용자 자동 생성 허용" ON users;

-- 새로운 정책 추가 (무한 재귀 방지)
CREATE POLICY "사용자는 자신의 정보 조회 가능" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "신규 사용자 생성 허용" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "사용자는 자신의 정보 수정 가능" ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id);
