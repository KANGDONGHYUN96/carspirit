# 캐피탈 업체별 특이사항 챗봇 프로젝트

## 📋 프로젝트 개요

캐피탈/렌트/리스 업체별 특이사항 데이터를 갤러리 카드로 보여주고, AI 챗봇으로 질의응답할 수 있는 시스템

---

## 🗂️ 1. Supabase 데이터베이스 설계

### 테이블: `company_details` (업체별 특이사항)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 기본키 |
| `company_name` | TEXT | 업체명 (예: 메리츠캐피탈, KB캐피탈) |
| `logo_url` | TEXT | 로고 이미지 URL |
| `product_types` | TEXT[] | 상품구분 (장기렌트, 리스) |
| `website_link` | TEXT | 웹사이트 링크 |
| `kakao_link` | TEXT | 카카오톡 오픈채팅 링크 |
| `id_pw` | TEXT | 로그인 정보 |
| `email` | TEXT | 이메일 |
| `fax` | TEXT | 팩스 |
| `address` | TEXT | 업체 주소 |
| `phone` | TEXT | 전화번호 |
| `delivery_company` | TEXT | 탁송업체 |
| `construction_industry` | TEXT | 건설업 조건 |
| `insurance_change_after_contract` | TEXT | 계약 후 보험조건 변경 |
| `domestic_import_available` | TEXT | 국산차/수입차 취급가능여부 |
| `other_notice` | TEXT | 기타 공지 |
| `liability_limit` | TEXT | 대물한도 |
| `rent_import_insurance_age` | TEXT | 렌트 수입차 보험연령 |
| `lease_pledge` | TEXT | 리스 질권설정 |
| `deductible` | TEXT | 면책금 |
| `license_guarantee` | TEXT | 면허보증 |
| `deposit_account` | TEXT | 보증금/선수금 입금계좌 |
| `succession_fee` | TEXT | 승계 수수료 |
| `new_corporation` | TEXT | 신설법인 |
| `screening_funding` | TEXT | 심사/펀딩 |
| `age_limit` | TEXT | 연령제한 |
| `overdue_interest_rate` | TEXT | 연체이자율 |
| `foreigner` | TEXT | 외국인 |
| `driver_range` | TEXT | 운전자 범위 |
| `mileage_excess` | TEXT | 운행거리 초과/유예거리 |
| `drunk_reacquired_under_1year` | TEXT | 음주취소 후 재취득자 1년미만 진행 가능여부 |
| `early_termination_penalty` | TEXT | 중도해지위약율 |
| `family_driver_condition` | TEXT | 직계가족 운전가능 조건 |
| `total_loss` | TEXT | 차량 전손시 |
| `handling_restrictions` | TEXT | 취급제한 |
| `account_name_change` | TEXT | 통장 명의변경 |
| `created_at` | TIMESTAMP | 생성일시 |
| `updated_at` | TIMESTAMP | 수정일시 |

### 테이블: `company_files` (업체 관련 파일)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 기본키 |
| `company_id` | UUID | 외래키 (company_details) |
| `file_name` | TEXT | 파일명 |
| `file_url` | TEXT | Supabase Storage URL |
| `file_type` | TEXT | 파일 타입 (pdf, image, excel) |
| `file_size` | BIGINT | 파일 크기 (bytes) |
| `uploaded_at` | TIMESTAMP | 업로드 일시 |

### Supabase Storage Bucket

- **Bucket 이름**: `company-files`
- **구조**:
  ```
  company-files/
  ├── meritz/
  │   ├── contract.pdf
  │   ├── insurance.xlsx
  │   └── car-image.jpg
  ├── kb/
  ├── woori/
  └── shinhan/
  ```

---

## 🎨 2. 갤러리 카드 UI (대시보드 페이지)

### 위치
- **페이지**: `/dashboard`
- **위치**: 대시보드 페이지 맨 밑 (실적 컴포넌트 삭제 후 그 자리)

### 갤러리 카드 레이아웃
```
┌─────────────────────────────────────────┐
│  🏨 업체별 특이사항                      │
├─────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │로고│ │로고│ │로고│ │로고│ │로고│    │
│  │메리│ │ KB │ │우리│ │신한│ │ BN │    │
│  │츠  │ │캐피│ │금융│ │카드│ │ K  │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘    │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │더많│ │은업│ │체카│ │드들│ │... │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

### 카드 클릭 시 모달 팝업
- **레이아웃**: 중앙 모달 (스크린샷 참고)
- **내용**:
  - 업체 로고 (상단)
  - 업체명
  - 상품구분 (장기렌트/리스 태그)
  - 링크, ID/PW, 이메일, 팩스 등
  - 모든 특이사항 정보 표시

### 컴포넌트 구조
```
components/
├── dashboard/
│   ├── company-gallery.tsx         # 갤러리 그리드
│   ├── company-card.tsx            # 개별 카드
│   └── company-detail-modal.tsx    # 상세보기 모달
```

---

## 💬 3. AI 챗봇 시스템

### 챗봇 레이아웃
- **UI 스타일**: Claude 챗봇 형식
- **위치**: 별도 페이지 `/chatbot` 또는 전역 플로팅 버튼

```
┌─────────────────────────────────────┐
│  🤖 CarSpirit 챗봇                   │
├─────────────────────────────────────┤
│                                     │
│  [사용자] 만21세 어디서 진행가능해?  │
│                                     │
│     [챗봇] 만21세 진행 가능한 업체:  │
│            • 우리카드                │
│            • 신한카드                │
│            [카드 2개 표시]           │
│                                     │
│  [사용자] 전손 났을 때 유리한 곳은?  │
│                                     │
│     [챗봇] 차량 전손 시 조건:        │
│            • 메리츠: 중도해지+면책금 │
│            • KB: ...                │
│            [비교 표 표시]            │
│                                     │
├─────────────────────────────────────┤
│  📎 [파일 첨부] 💬 [메시지 입력...]  │
└─────────────────────────────────────┘
```

### 챗봇 기능

#### 질문 예시
1. **연령 조건**: "만21세 어디서 진행가능해?"
2. **주행거리**: "전기차 연간주행거리 4만 이상인 곳은 어디야?"
3. **전손 조건**: "전손 났을땐 어디가 가장 유리해?"
4. **계약 기간**: "2년 전기차 되는곳은 어디야?"
5. **외국인**: "외국인 진행 가능한 업체 알려줘"
6. **면책금**: "면책금 가장 낮은 곳은?"

#### AI 처리 로직
```
사용자 질문
    ↓
AI가 질문 분석 (OpenAI/Claude)
    ↓
관련 컬럼 식별 (예: "만21세" → age_limit 컬럼)
    ↓
Supabase에서 데이터 필터링
    ↓
AI가 결과를 자연어로 요약
    ↓
갤러리 카드 + 텍스트 답변 출력
```

#### 파일 업로드 기능
- **지원 파일**: PDF, 이미지(JPG/PNG), 엑셀(XLS/XLSX)
- **처리 방식**:
  1. 사용자가 파일 업로드
  2. Supabase Storage에 저장
  3. AI가 파일 내용 분석 (OpenAI Vision API, PDF 파싱)
  4. 분석 결과를 채팅으로 응답
  5. 파일 다운로드 링크 제공

---

## 🛠️ 4. 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React, Tailwind CSS
- **상태관리**: React useState, useMemo

### Backend
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (기존 Google OAuth)

### AI
- **Provider**: OpenAI GPT-4 또는 Anthropic Claude
- **기능**:
  - 자연어 질문 분석
  - SQL 쿼리 생성
  - 답변 생성
  - 파일 내용 분석 (Vision API, PDF 파싱)

### File Processing
- **PDF**: `pdf-parse` 또는 `pdfjs-dist`
- **Excel**: `xlsx` 라이브러리
- **Image**: OpenAI Vision API

---

## 📁 5. 프로젝트 구조

```
carspirit/
├── app/
│   ├── dashboard/
│   │   └── page.tsx                    # 대시보드 (갤러리 추가)
│   ├── chatbot/
│   │   └── page.tsx                    # 챗봇 페이지
│   └── api/
│       ├── chat/
│       │   └── route.ts                # 챗봇 API
│       ├── companies/
│       │   └── route.ts                # 업체 데이터 API
│       └── upload/
│           └── route.ts                # 파일 업로드 API
├── components/
│   ├── dashboard/
│   │   ├── company-gallery.tsx         # 갤러리 그리드
│   │   ├── company-card.tsx            # 카드 컴포넌트
│   │   └── company-detail-modal.tsx    # 상세 모달
│   └── chatbot/
│       ├── chat-interface.tsx          # 채팅 UI
│       ├── message-bubble.tsx          # 메시지 버블
│       ├── company-card-result.tsx     # 챗봇용 카드 표시
│       └── file-upload.tsx             # 파일 업로드
├── lib/
│   ├── supabase.ts                     # Supabase 클라이언트
│   ├── openai.ts                       # OpenAI 클라이언트
│   └── file-parser.ts                  # 파일 파싱 유틸
├── supabase/
│   ├── create-company-details.sql      # 테이블 생성 SQL
│   └── seed-companies.sql              # 샘플 데이터
└── docs/
    └── chatbot-project-plan.md         # 이 문서
```

---

## 📝 6. 구현 단계

### Phase 1: 데이터베이스 구축
- [ ] Supabase 테이블 생성 (`company_details`, `company_files`)
- [ ] Storage Bucket 생성 (`company-files`)
- [ ] 샘플 데이터 입력 (메리츠, KB, 우리, 신한)

### Phase 2: 갤러리 UI 구현
- [ ] 대시보드에서 실적 컴포넌트 제거
- [ ] 갤러리 카드 컴포넌트 생성
- [ ] 카드 클릭 시 상세 모달 구현
- [ ] Supabase 데이터 연동

### Phase 3: 챗봇 기본 기능
- [ ] 챗봇 페이지/레이아웃 생성 (Claude 스타일)
- [ ] OpenAI/Claude API 연동
- [ ] 질문 분석 → DB 쿼리 → 답변 생성 파이프라인
- [ ] 갤러리 카드 형태로 결과 표시

### Phase 4: 파일 업로드 기능
- [ ] 파일 업로드 UI 구현
- [ ] Supabase Storage 연동
- [ ] PDF/Excel/Image 파싱 기능
- [ ] AI 파일 분석 연동

### Phase 5: 테스트 및 최적화
- [ ] 응답 속도 최적화
- [ ] 에러 핸들링
- [ ] UI/UX 개선

---

## 💰 7. Supabase 용량 관리

### 무료 플랜 제한
- 저장공간: 1GB
- 파일 크기: 최대 50MB/파일
- 트래픽: 월 2GB

### 유료 플랜 ($25/월)
- 저장공간: 100GB
- 파일 크기: 최대 5GB/파일
- 트래픽: 월 200GB

### 권장사항
- 이미지는 압축하여 업로드
- 불필요한 파일 정기 삭제
- 대용량 파일은 외부 CDN 고려

---

## 🚀 8. 예상 성능

### 렉(Lag) 걱정?
- ✅ **문제없음**: 각 기능이 별도 페이지로 분리되어 있음
- ✅ **Lazy Loading**: 필요한 컴포넌트만 로딩
- ⚠️ **AI 응답 시간**: 2-5초 소요 (API 호출 시간)

### 최적화 전략
1. 캐싱: 자주 묻는 질문 답변 캐싱
2. 인덱싱: DB 컬럼에 적절한 인덱스 생성
3. CDN: 이미지/파일은 CDN 사용 고려

---

## 📌 참고 사항

### 데이터 예시 (메리츠캐피탈)
- 업체명: 메리츠캐피탈
- 상품구분: 장기렌트, 리스
- 연령제한: 렌트 만26~75세, 리스 무제한
- 면책금: 10만원, 20만원, 30만원
- 외국인: 진행가능
- 중도해지위약율: 규정 20%, 중도해지 85%

### AI 프롬프트 예시
```
당신은 렌트/리스 업체 정보 전문가입니다.
사용자의 질문을 분석하여 관련 업체를 찾아주세요.

데이터베이스 스키마:
- company_name: 업체명
- age_limit: 연령제한
- mileage_excess: 운행거리
- total_loss: 전손 조건
...

사용자 질문: "만21세 진행 가능한 곳은?"

분석:
1. 질문 의도: 연령 조건 확인
2. 관련 컬럼: age_limit
3. 필터 조건: age_limit에 "만21세" 또는 "만21" 포함
4. SQL: SELECT * FROM company_details WHERE age_limit LIKE '%만21%'
```

---

## ✅ 체크리스트

- [ ] Supabase 프로젝트 설정 확인
- [ ] OpenAI/Claude API 키 발급
- [ ] 환경변수 설정 (.env.local)
- [ ] 업체 로고 이미지 준비
- [ ] 실제 데이터 수집 및 입력

---

**작성일**: 2025-10-30
**버전**: 1.0
**작성자**: Claude Code
