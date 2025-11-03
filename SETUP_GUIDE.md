# CarSpirit 설정 가이드

이 문서는 CarSpirit 관리시스템을 처음부터 설정하는 방법을 단계별로 안내합니다.

## 📋 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn
- Google 계정
- Supabase 계정

## 🚀 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 프로젝트 만들기

1. [Supabase](https://supabase.com) 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: CarSpirit (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) 선택
4. "Create new project" 클릭 (2-3분 소요)

### 1.2 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 메뉴 선택
2. "New query" 클릭
3. 프로젝트의 `supabase/schema.sql` 파일 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. 성공 메시지 확인

### 1.3 API 키 확인

1. Supabase 대시보드에서 **Settings** > **API** 메뉴 선택
2. 다음 정보를 복사해둡니다:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

## 🔐 2단계: Google OAuth 설정

### 2.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성:
   - 상단 프로젝트 선택 드롭다운 > "NEW PROJECT"
   - 프로젝트 이름: "CarSpirit" 입력
   - "CREATE" 클릭

3. OAuth 동의 화면 구성:
   - 좌측 메뉴 > **APIs & Services** > **OAuth consent screen**
   - User Type: **Internal** 선택 (조직 내부용)
   - "CREATE" 클릭
   - App information 입력:
     - App name: "CarSpirit"
     - User support email: 본인 이메일
     - Developer contact: 본인 이메일
   - "SAVE AND CONTINUE" 클릭
   - Scopes 페이지에서 "SAVE AND CONTINUE"
   - Summary 페이지에서 "BACK TO DASHBOARD"

4. OAuth 2.0 클라이언트 ID 생성:
   - 좌측 메뉴 > **APIs & Services** > **Credentials**
   - "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "CarSpirit Web Client"
   - Authorized redirect URIs:
     - `https://[your-project-id].supabase.co/auth/v1/callback` 추가
     - (Supabase 프로젝트 URL 사용)
   - "CREATE" 클릭
   - **Client ID**와 **Client Secret** 복사 (중요!)

### 2.2 Supabase에 Google OAuth 연동

1. Supabase 대시보드 > **Authentication** > **Providers**
2. "Google" 찾아서 클릭
3. 다음 정보 입력:
   - **Enable Sign in with Google**: ON
   - **Client ID**: Google에서 복사한 Client ID
   - **Client Secret**: Google에서 복사한 Client Secret
4. "Save" 클릭

## 💻 3단계: 프로젝트 설정

### 3.1 환경 변수 설정

1. 프로젝트 루트의 `.env.local` 파일 열기
2. Supabase 정보 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

3. 파일 저장

### 3.2 의존성 설치

터미널에서 프로젝트 디렉토리로 이동 후:

```bash
cd carspirit
npm install
```

### 3.3 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 👤 4단계: 첫 관리자 계정 설정

### 4.1 첫 로그인

1. 로그인 페이지에서 "Google로 로그인" 클릭
2. Google 계정으로 로그인
3. "승인 대기 중" 페이지가 표시됩니다

### 4.2 수동으로 관리자 권한 부여

1. Supabase 대시보드 > **Table Editor** 메뉴
2. `users` 테이블 선택
3. 방금 생성된 사용자 행 찾기
4. 다음 필드 수정:
   - `approved`: `false` → `true`로 변경
   - `role`: `salesperson` → `admin`으로 변경
5. 저장

### 4.3 로그인 완료

1. 로그인 페이지로 돌아가서 다시 로그인
2. 대시보드 접속 확인

## 🔧 5단계: 추가 설정 (선택사항)

### 5.1 이메일 알림 설정

Supabase > **Authentication** > **Email Templates**에서 이메일 템플릿 커스터마이징

### 5.2 보안 설정

1. Supabase > **Authentication** > **URL Configuration**
   - Site URL: 실제 배포 URL 입력
   - Redirect URLs: 허용할 리다이렉트 URL 추가

2. Supabase > **Settings** > **API**
   - JWT expiry: 토큰 만료 시간 설정 (기본 3600초)

### 5.3 IP 화이트리스트 (관리자 페이지용)

`users` 테이블의 `allowed_ip` 필드에 허용할 IP 주소 입력

## 🎉 완료!

이제 CarSpirit 관리시스템을 사용할 준비가 되었습니다.

## 📝 다음 할 일

1. **사용자 추가**: 팀원들을 초대하고 관리자가 승인
2. **데이터 입력**: 캐피탈 프로모션, 전략차종 등 초기 데이터 입력
3. **테스트**: 각 기능을 테스트하여 정상 작동 확인

## 🆘 문제 해결

### 로그인이 안 돼요
- Google OAuth 설정 확인
- Redirect URI가 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### "승인 대기 중" 페이지에서 벗어나지 못해요
- Supabase Table Editor에서 `users` 테이블의 `approved` 필드를 `true`로 변경

### 환경 변수가 인식되지 않아요
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)
- 변수명이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)

### 데이터베이스 연결 오류
- Supabase URL과 API Key가 정확한지 확인
- Supabase 프로젝트가 일시 중지되지 않았는지 확인

## 📞 지원

추가 도움이 필요하면 개발팀에 문의하세요.
