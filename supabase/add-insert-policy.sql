-- users 테이블에 신규 사용자 자동 생성을 위한 INSERT 정책 추가
CREATE POLICY "신규 사용자 자동 생성 허용" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);
