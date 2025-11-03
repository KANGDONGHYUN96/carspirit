-- 챗봇 파일 업로드를 위한 테이블 생성
CREATE TABLE IF NOT EXISTS chat_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE chat_files ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 파일 읽기 가능
CREATE POLICY "Anyone can view chat files"
  ON chat_files FOR SELECT
  USING (true);

-- 인증된 사용자만 파일 업로드 가능
CREATE POLICY "Authenticated users can upload files"
  ON chat_files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 업로더만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete their own files"
  ON chat_files FOR DELETE
  USING (auth.uid() = uploaded_by);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_files_uploaded_at ON chat_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_files_uploaded_by ON chat_files(uploaded_by);
