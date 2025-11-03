# Supabase UI 디자인 분석

## 🎨 전체 컬러 시스템

### 배경 컬러
- **Primary Background**: `#0A0A0A` ~ `#121212` (매우 어두운 검정)
- **Secondary Background**: `#1A1A1A` ~ `#1F1F1F` (약간 밝은 검정)
- **Card Background**: `#1E1E1E` ~ `#252525` (반투명 효과 포함)

### 브랜드 컬러 (Green Gradient)
- **Primary Green**: `#3ECF8E` (밝은 민트 그린)
- **Secondary Green**: `#2DD4BF` (청록색)
- **Gradient**: `linear-gradient(135deg, #3ECF8E 0%, #2DD4BF 100%)`
- **Glow Effect**: 그린 컬러에 blur 효과로 발광 느낌

### 텍스트 컬러
- **Primary Text**: `#FFFFFF` (순백)
- **Secondary Text**: `#A0A0A0` ~ `#B0B0B0` (밝은 회색)
- **Muted Text**: `#666666` ~ `#808080` (어두운 회색)

---

## 📐 레이아웃 구조

### 1. **Hero Section (히어로 섹션)**
```
┌─────────────────────────────────────────┐
│         Navigation Bar (투명/blur)        │
├─────────────────────────────────────────┤
│                                         │
│     Build in a weekend                  │
│     Scale to millions                   │  ← 큰 타이틀 (60-80px)
│                                         │
│  Supabase is the Postgres              │
│  development platform.                  │  ← 서브 타이틀 (18-24px)
│                                         │
│   [Start your project] [Documentation]  │  ← CTA 버튼
│                                         │
│  Trusted by fast-growing companies...   │
│  [회사 로고들...]                         │
│                                         │
└─────────────────────────────────────────┘
```

**특징:**
- 중앙 정렬
- 타이틀은 그라데이션 텍스트 (Green to Cyan)
- 배경에 subtle한 그리드 패턴
- CTA 버튼은 그린 배경 + 호버시 그로우 효과

---

### 2. **Product Cards Section (제품 소개)**

```
┌────────────────────┐  ┌────────────────────┐
│  [Product Image]   │  │  [Product Image]   │
│                    │  │                    │
│  Postgres Database │  │  Authentication    │
│                    │  │                    │
│  Every project is  │  │  Add user sign ups │
│  a full Postgres   │  │  and logins...     │
│  database...       │  │                    │
│                    │  │                    │
│  • 100% portable   │  │                    │
│  • Built-in Auth   │  │                    │
│  • Easy to extend  │  │                    │
└────────────────────┘  └────────────────────┘
```

**특징:**
- Grid 레이아웃 (2-3 columns)
- 각 카드에 hover 효과 (border glow)
- 카드 배경: `rgba(255,255,255,0.03)` ~ 매우 약한 투명도
- Border: `1px solid rgba(255,255,255,0.1)`
- Border Radius: `12px` ~ `16px`
- Padding: `32px` ~ `48px`

---

### 3. **Features Grid**

제품 기능들을 나열하는 섹션:

```
┌──────────────────────────────────────────┐
│                                          │
│  [Database Icon]  [Auth Icon]  [Edge]   │
│                                          │
│  [Storage Icon]   [Realtime]  [Vector]  │
│                                          │
│  [API Icon]       ...                    │
│                                          │
└──────────────────────────────────────────┘
```

**아이콘/이미지 스타일:**
- SVG 아이콘 또는 일러스트레이션
- 다크 버전과 라이트 버전 모두 제공 (테마 전환)
- 아이콘 주변에 subtle glow 효과

---

### 4. **Customer Testimonials (고객 후기)**

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ [Avatar]       │ │ [Avatar]       │ │ [Avatar]       │
│ @username      │ │ @username      │ │ @username      │
│                │ │                │ │                │
│ "Really        │ │ "I've been     │ │ "Love how      │
│  impressed..." │ │  using..."     │ │  Supabase..."  │
│                │ │                │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
```

**특징:**
- 가로 스크롤 가능 (Horizontal Scrolling Carousel)
- 각 카드는 트위터 스타일
- 카드 크기: 고정 width (280px ~ 320px)
- Avatar는 원형 (48px)
- 카드 배경: 약한 회색 `#1A1A1A`
- Hover시 약간 위로 올라가는 효과 (`translateY(-4px)`)

---

## 🎭 타이포그래피

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes
- **Hero Title**: `60px` ~ `80px` (font-weight: 700-800)
- **Section Heading**: `36px` ~ `48px` (font-weight: 700)
- **Card Title**: `24px` ~ `28px` (font-weight: 600)
- **Body Text**: `16px` ~ `18px` (font-weight: 400)
- **Small Text**: `14px` (font-weight: 400)

### Line Height
- 헤딩: `1.1` ~ `1.2`
- Body: `1.6` ~ `1.8`

---

## 🎪 버튼 디자인

### Primary Button (CTA)
```css
background: linear-gradient(135deg, #3ECF8E, #2DD4BF);
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
box-shadow: 0 0 20px rgba(62, 207, 142, 0.4); /* glow */
transition: all 0.3s ease;
```

**Hover State:**
```css
transform: translateY(-2px);
box-shadow: 0 0 30px rgba(62, 207, 142, 0.6);
```

### Secondary Button
```css
background: transparent;
border: 1px solid rgba(255, 255, 255, 0.2);
padding: 12px 24px;
border-radius: 8px;
color: #FFFFFF;
```

**Hover State:**
```css
border-color: rgba(255, 255, 255, 0.4);
background: rgba(255, 255, 255, 0.05);
```

---

## ✨ 애니메이션 & 인터랙션

### 1. **Fade In (스크롤 시)**
```css
opacity: 0;
transform: translateY(30px);
animation: fadeInUp 0.6s ease forwards;

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2. **Card Hover Effect**
```css
transition: all 0.3s ease;

&:hover {
  transform: translateY(-4px);
  border-color: rgba(62, 207, 142, 0.4);
  box-shadow: 0 8px 32px rgba(62, 207, 142, 0.15);
}
```

### 3. **Glow Effect (Background)**
```css
position: absolute;
background: radial-gradient(circle, rgba(62, 207, 142, 0.15), transparent);
filter: blur(100px);
animation: pulse 4s ease-in-out infinite;
```

---

## 📱 반응형 디자인

### Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  .hero-title { font-size: 36px; }
  .grid { grid-template-columns: 1fr; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .hero-title { font-size: 48px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1025px) {
  .hero-title { font-size: 72px; }
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## 🎨 특수 효과

### 1. **Gradient Text**
```css
background: linear-gradient(135deg, #3ECF8E, #2DD4BF);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### 2. **Glass Morphism (카드)**
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### 3. **Backdrop Blur (Navigation)**
```css
background: rgba(10, 10, 10, 0.8);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
```

---

## 📦 주요 컴포넌트 구조

### Navigation Bar
```
┌────────────────────────────────────────────┐
│ [Logo]  Products  Docs  Pricing  [Sign In] │
└────────────────────────────────────────────┘
```
- Position: `fixed` (스크롤시 blur 배경)
- Height: `64px` ~ `80px`
- Logo 왼쪽, CTA 오른쪽

### Footer
```
┌─────────────────────────────────────────────┐
│  Product    Company    Resources    Social  │
│  Database   About      Docs         Twitter │
│  Auth       Blog       Guides       GitHub  │
│  Storage    Careers    Examples     Discord │
│                                             │
│  © 2024 Supabase Inc.                       │
└─────────────────────────────────────────────┘
```
- 4-column grid
- 회색 텍스트 (#808080)
- Link hover시 밝아짐

---

## 🎯 핵심 디자인 원칙

1. **Minimalism**: 불필요한 요소 제거, 충분한 여백
2. **Dark First**: 다크 모드를 기본으로
3. **Subtle Effects**: 과하지 않은 그라데이션과 글로우
4. **Clear Hierarchy**: 타이포그래피로 명확한 정보 계층
5. **Smooth Interactions**: 모든 트랜지션 0.3s ease
6. **Green Accent**: 포인트 컬러로 일관성 유지

---

## 🛠 기술 스택 추정

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS + Custom CSS
- **Animations**: Framer Motion 또는 CSS Animations
- **Icons**: SVG (커스텀 일러스트레이션)
- **Fonts**: Inter (Google Fonts)

---

## 📋 체크리스트 (구현시 참고)

- [ ] 다크 배경 (#0A0A0A)
- [ ] 그린 그라데이션 브랜드 컬러
- [ ] 큰 타이포그래피 (60px+)
- [ ] 카드에 glass morphism 효과
- [ ] Hover시 glow 효과
- [ ] 부드러운 애니메이션 (0.3s ease)
- [ ] 고객 후기 가로 스크롤
- [ ] Navigation bar sticky + blur
- [ ] 반응형 grid 레이아웃
- [ ] 그라데이션 텍스트 효과
