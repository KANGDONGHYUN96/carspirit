-- company-files 버킷에 대한 Storage 정책 생성

-- 1. 모든 사용자가 파일 읽기 가능
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-files');

-- 2. 인증된 사용자만 파일 업로드 가능
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-files' AND auth.role() = 'authenticated');

-- 3. 인증된 사용자만 파일 업데이트 가능
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-files' AND auth.role() = 'authenticated');

-- 4. 인증된 사용자만 파일 삭제 가능
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-files' AND auth.role() = 'authenticated');
