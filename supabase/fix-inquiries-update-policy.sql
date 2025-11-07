-- Inquiries 테이블 UPDATE 정책 수정
-- 오픈DB에서 잠금 시 모든 인증된 사용자가 업데이트 가능하도록 함

DROP POLICY IF EXISTS "배정된 사용자만 문의 수정 가능" ON inquiries;
DROP POLICY IF EXISTS "문의 수정 권한" ON inquiries;

-- 새로운 UPDATE 정책: 모든 인증된 사용자가 문의 수정 가능 (오픈DB 잠금 허용)
CREATE POLICY "인증된 사용자 문의 수정 가능" ON inquiries
  FOR UPDATE
  TO authenticated
  USING (true);
