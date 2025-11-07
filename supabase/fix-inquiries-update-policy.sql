-- Inquiries 테이블 UPDATE 정책 수정
-- 오픈DB에서 잠금 시 user_id 업데이트를 허용하기 위함

DROP POLICY IF EXISTS "배정된 사용자만 문의 수정 가능" ON inquiries;

-- 새로운 UPDATE 정책: user_id 소유자, assigned_to, 또는 관리자가 수정 가능
CREATE POLICY "문의 수정 권한" ON inquiries
  FOR UPDATE
  USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );
