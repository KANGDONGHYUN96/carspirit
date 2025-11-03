# CarSpirit 배포 가이드

## Vercel 배포하기

### 1. Vercel 계정 설정

1. [Vercel](https://vercel.com)에 가입하거나 로그인합니다
2. GitHub 계정과 연동합니다

### 2. 프로젝트를 GitHub에 푸시

```bash
cd carspirit
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Vercel에서 프로젝트 임포트

1. Vercel 대시보드에서 "Add New Project" 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `.next` (자동 설정됨)

### 4. 환경 변수 설정

Vercel 프로젝트 설정의 "Environment Variables" 섹션에서 다음 환경 변수를 추가하세요:

#### 필수 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://uxxztunswlxwsqphcpai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eHp0dW5zd2x4d3NxcGhjcGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTg3MDgsImV4cCI6MjA3NzIzNDcwOH0.JKlDlXv3x-RwZ6b3Q7EmFbE5O3_XRg3O_LW4OYpSlsM
OPENAI_API_KEY=<your-openai-api-key>
```

**중요**:
- Production, Preview, Development 환경 모두에 동일한 환경 변수를 설정하세요
- `OPENAI_API_KEY`는 보안을 위해 새로운 키로 교체하는 것을 권장합니다

### 5. 배포하기

1. "Deploy" 버튼을 클릭합니다
2. 빌드가 완료되면 자동으로 배포됩니다
3. 배포된 URL을 확인합니다 (예: `https://carspirit.vercel.app`)

### 6. 도메인 설정 (선택사항)

1. Vercel 프로젝트 설정에서 "Domains" 탭으로 이동
2. 사용할 도메인을 추가합니다
3. DNS 설정을 업데이트합니다

## 배포 후 확인 사항

### 1. Supabase 설정 확인

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. Authentication > URL Configuration에서:
   - **Site URL**: Vercel 배포 URL 추가
   - **Redirect URLs**: `https://your-domain.vercel.app/auth/callback` 추가

### 2. 보안 설정

1. Supabase > Authentication > Providers에서 이메일 인증 활성화 확인
2. Row Level Security (RLS) 정책이 올바르게 설정되어 있는지 확인
3. API 키가 노출되지 않도록 주의

### 3. 기능 테스트

배포 후 다음 기능들이 정상 작동하는지 확인하세요:

- [ ] 로그인/로그아웃
- [ ] 대시보드 로딩
- [ ] 업체별 특이사항 조회/편집 (관리자)
- [ ] 금융사 운용조건 캐러셀
- [ ] 전략차종 표시
- [ ] 채팅봇 기능
- [ ] 문의 관리
- [ ] 계약 관리

## 업데이트 배포하기

GitHub에 코드를 푸시하면 Vercel이 자동으로 빌드하고 배포합니다:

```bash
git add .
git commit -m "Update message"
git push
```

## 트러블슈팅

### 빌드 실패 시

1. Vercel 빌드 로그를 확인합니다
2. 로컬에서 `npm run build`를 실행하여 빌드 에러를 확인합니다
3. 필요한 환경 변수가 모두 설정되어 있는지 확인합니다

### 인증 문제 시

1. Supabase의 Redirect URLs가 올바르게 설정되어 있는지 확인
2. 환경 변수가 정확한지 확인
3. 브라우저 캐시를 지우고 다시 시도

### 이미지/파일 업로드 문제 시

1. Supabase Storage 버킷 권한 확인
2. RLS 정책 확인
3. 파일 크기 제한 확인

## 환경별 설정

### Production
- 실제 운영 환경
- 모든 보안 설정 활성화
- 프로덕션 데이터베이스 사용

### Preview
- Pull Request별로 자동 생성되는 미리보기 환경
- 개발 중인 기능 테스트용

### Development
- 로컬 개발 환경
- `.env.local` 파일 사용

## 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 문서](https://supabase.com/docs)
