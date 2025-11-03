-- Allow admins and managers to view all users
CREATE POLICY "관리자는 모든 사용자 조회 가능" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'manager')
      AND users.approved = true
    )
  );

-- Allow admins and managers to update user status and roles
CREATE POLICY "관리자는 사용자 정보 수정 가능" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'manager')
      AND users.approved = true
    )
  );
