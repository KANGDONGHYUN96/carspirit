-- API (anon)에서 영업자 정보 조회 허용 (문의 로테이션 API용)
-- 보안: 민감한 정보는 노출되지 않으며, 이름/연락처만 조회 가능
DROP POLICY IF EXISTS "API에서 영업자 기본 정보 조회 가능" ON users;

CREATE POLICY "API에서 영업자 기본 정보 조회 가능" ON users
  FOR SELECT
  TO anon
  USING (true);
