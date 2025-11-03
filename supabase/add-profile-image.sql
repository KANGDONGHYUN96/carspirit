-- users 테이블에 프로필 이미지 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
