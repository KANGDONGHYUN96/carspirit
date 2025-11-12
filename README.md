# CarSpirit 관리시스템

렌트/리스 영업 프로세스를 디지털화하기 위한 내부 통합 플랫폼입니다.

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Google OAuth (Supabase Auth)
- **Deployment**: Vercel (권장)

## 시작하기

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 데이터베이스 스키마 생성
3. Authentication > Providers에서 Google OAuth 활성화
   - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
   - Authorized redirect URIs에 `https://[your-project].supabase.co/auth/v1/callback` 추가

### 2. 환경 변수 설정

`.env.local` 파일에 Supabase 정보 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 주요 기능

### 인증 시스템

- Google OAuth 로그인
- 역할 기반 접근 제어 (RBAC)
  - `salesperson`: 영업자
  - `manager`: 매니저
  - `admin`: 관리자
- 신규 사용자 승인 프로세스
- Row Level Security (RLS) 적용

### 영업자용 페이지

1. **대시보드**: 캐피탈 프로모션, 전략차종, 실적 요약
2. **고객문의**: 문의 관리 및 상태 추적
3. **즉시출고**: 재고 차량 검색
4. **챗봇 로그**: AI 상담 기록
5. **계약관리**: 계약 등록 및 관리
6. **내 계정**: 프로필 설정

### 관리자용 페이지

1. **캐피탈 프로모션 관리**: 지원금 정보 등록
2. **전략차종 관리**: 추천 차량 관리
3. **사용자 관리**: 승인 및 권한 관리
4. **매출분석**: 통계 및 차트
5. **시스템 설정**: 보안 및 알림 설정
6. **수정이력**: 변경 추적

## 프로젝트 구조

```
carspirit/
├── app/                      # Next.js App Router
│   ├── auth/                 # 인증 관련 페이지
│   │   ├── callback/         # OAuth 콜백
│   │   ├── pending/          # 승인 대기
│   │   └── auth-code-error/  # 에러 페이지
│   ├── login/                # 로그인 페이지
│   └── dashboard/            # 대시보드
├── lib/                      # 유틸리티 및 헬퍼
│   ├── supabase/             # Supabase 클라이언트
│   └── auth/                 # 인증 헬퍼
├── types/                    # TypeScript 타입 정의
├── supabase/                 # Supabase 스키마
└── middleware.ts             # Next.js 미들웨어
```

## 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 정보 및 권한
- `capital_promotions`: 캐피탈 프로모션
- `strategic_models`: 전략차종
- `inquiries`: 고객문의
- `stock_list`: 즉시출고 차량
- `chatbot_logs`: 상담 로그
- `contracts`: 계약 정보
- `logs`: 수정 이력

## 보안

- Row Level Security (RLS) 적용
- 역할 기반 접근 제어
- 사용자 승인 프로세스
- IP 화이트리스트 (관리자 페이지)
- HTTPS 강제 적용

## 다음 단계

### Phase 2: 영업자용 페이지 구현
- [ ] 대시보드 UI 및 데이터 연동
- [ ] 고객문의 관리 기능
- [ ] 즉시출고 검색 기능
- [ ] 챗봇 로그 기능
- [ ] 계약관리 CRUD

### Phase 3: 관리자용 페이지 구현
- [ ] 프로모션 관리
- [ ] 전략차종 관리
- [ ] 사용자 승인 시스템
- [ ] 매출 분석 대시보드
- [ ] 시스템 설정

### Phase 4: 고급 기능
- [ ] 실시간 알림
- [ ] PDF 보고서 생성
- [ ] 엑셀 내보내기
- [ ] AI 추천 기능
- [ ] 슬랙/노션 연동

## 라이센스

Private - 내부용

---
Last updated: 2025-01-12
