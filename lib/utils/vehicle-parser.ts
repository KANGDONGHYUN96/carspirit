import type { ParsedVehicle } from '@/types/instant-delivery'

// 브랜드별 차량 모델 키워드
const BRAND_KEYWORDS: Record<string, string[]> = {
  '현대': [
    '아반떼', '쏘나타', '그랜저', '아이오닉', '코나', '투싼',
    '싼타페', '팰리세이드', '스타리아', '베뉴', '캐스퍼', '넥쏘'
  ],
  '기아': [
    'K3', 'K5', 'K8', 'K9', 'EV3', 'EV4', 'EV5', 'EV6', 'EV9',
    '니로', '셀토스', '쏘렌토', '카니발', '스포티지', '모닝', '레이',
    '봉고', '타스만', 'Tasman', 'PV5', '스팅어'
  ],
  '제네시스': [
    'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'
  ],
  'BMW': [
    '1시리즈', '2시리즈', '3시리즈', '4시리즈', '5시리즈', '6시리즈', '7시리즈', '8시리즈',
    'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'iX', 'iX1', 'iX3', 'i4', 'i5', 'i7'
  ],
  '벤츠': [
    'A클래스', 'B클래스', 'C클래스', 'E클래스', 'S클래스',
    'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'
  ],
  '아우디': [
    'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
    'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'e-tron'
  ],
  '볼보': [
    'S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90'
  ],
  '테슬라': [
    '모델3', '모델S', '모델X', '모델Y', 'Model 3', 'Model S', 'Model X', 'Model Y'
  ],
  '폴스타': [
    '폴스타2', '폴스타3', '폴스타4', 'Polestar 2', 'Polestar 3', 'Polestar 4'
  ],
  '쉐보레': [
    '트랙스', '트레일블레이저', '이쿼녹스', '타호', '콜로라도', '볼트', '말리부'
  ],
  'KGM': [
    '티볼리', '코란도', '렉스턴', '토레스', '액티언'
  ],
  '르노코리아': [
    'XM3', 'QM6', '아르카나', '그랑 콜레오스', '마스터', '조에'
  ]
}

// 브랜드명 정규화 (다양한 표기 → 표준 브랜드명)
const BRAND_ALIASES: Record<string, string> = {
  '현대': '현대',
  '현대자동차': '현대',
  'HYUNDAI': '현대',
  'Hyundai': '현대',
  '기아': '기아',
  '기아자동차': '기아',
  'KIA': '기아',
  'Kia': '기아',
  '제네시스': '제네시스',
  'GENESIS': '제네시스',
  'Genesis': '제네시스',
  'BMW': 'BMW',
  '비엠더블유': 'BMW',
  '벤츠': '벤츠',
  'Mercedes-Benz': '벤츠',
  'Mercedes': '벤츠',
  '메르세데스벤츠': '벤츠',
  '아우디': '아우디',
  'Audi': '아우디',
  'AUDI': '아우디',
  '볼보': '볼보',
  'Volvo': '볼보',
  'VOLVO': '볼보',
  '테슬라': '테슬라',
  'Tesla': '테슬라',
  'TESLA': '테슬라',
  '폴스타': '폴스타',
  'Polestar': '폴스타',
  'POLESTAR': '폴스타',
  '쉐보레': '쉐보레',
  'Chevrolet': '쉐보레',
  'CHEVROLET': '쉐보레',
  'KGM': 'KGM',
  '쌍용': 'KGM',
  'SsangYong': 'KGM',
  '르노코리아': '르노코리아',
  '르노': '르노코리아',
  'Renault': '르노코리아',
  'Renault Korea': '르노코리아'
}

/**
 * 차량명에서 브랜드를 추출합니다.
 */
export function extractBrand(vehicleName: string): string {
  if (!vehicleName) return '기타'
  const normalizedName = vehicleName.trim()

  // 1. 브랜드명이 직접 포함된 경우 확인
  for (const [alias, standard] of Object.entries(BRAND_ALIASES)) {
    if (normalizedName.includes(alias)) {
      return standard
    }
  }

  // 2. 모델 키워드로 브랜드 추론
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword)) {
        return brand
      }
    }
  }

  // 3. 기타
  return '기타'
}

/**
 * 차량명에서 모델명을 추출합니다. (HEV/PHEV/EV 구분 포함)
 */
export function extractModelName(vehicleName: string, brand: string): string {
  if (!vehicleName) return '알수없음'
  const normalizedName = vehicleName.trim().toUpperCase()
  const originalName = vehicleName.trim()
  const keywords = BRAND_KEYWORDS[brand] || []

  // 모델 키워드 중 가장 먼저 매칭되는 것 찾기
  let baseModel = ''
  for (const keyword of keywords) {
    if (normalizedName.includes(keyword.toUpperCase())) {
      baseModel = keyword
      break
    }
  }

  // 기본 모델명 못 찾은 경우
  if (!baseModel) {
    const parts = originalName.split(/\s+/)
    if (parts.length >= 2) {
      baseModel = parts.slice(0, 2).join(' ')
    } else {
      baseModel = originalName
    }
  }

  // 파워트레인 타입 확인 (HEV, PHEV, EV 순서로 체크)
  // 하이브리드 체크 (HEV, 하이브리드)
  if (normalizedName.includes('PHEV') || normalizedName.includes('플러그인')) {
    return `${baseModel} PHEV`
  }
  if (normalizedName.includes('HEV') || normalizedName.includes('하이브리드') || normalizedName.includes('HYBRID')) {
    return `${baseModel} HEV`
  }
  // 순수 전기차 체크 (EV, 일렉트릭) - 단, 이미 EV가 모델명에 포함된 경우 제외
  if (!baseModel.toUpperCase().includes('EV')) {
    if (normalizedName.includes('일렉트릭') || normalizedName.includes('ELECTRIC')) {
      return `${baseModel} EV`
    }
  }

  return baseModel
}

/**
 * 차량명에서 트림 정보를 추출합니다.
 */
export function extractTrim(vehicleName: string, modelName: string): string | null {
  if (!vehicleName) return null
  const normalizedName = vehicleName.trim()

  // 모델명 이후의 문자열에서 트림 추출
  const modelIndex = normalizedName.indexOf(modelName)
  if (modelIndex >= 0) {
    const afterModel = normalizedName.slice(modelIndex + modelName.length).trim()

    // 트림 키워드 패턴
    const trimPatterns = [
      /(\d+\.\d+\s*(?:터보|가솔린|디젤|HEV|PHEV|EV|LPG)?)/i,
      /(프리미엄|익스클루시브|시그니처|캘리그라피|노블레스|프레스티지|인스퍼레이션|모던|스마트|트렌디)/,
      /(2WD|4WD|AWD|FF|FR|RR)/,
      /(5인승|6인승|7인승|8인승|9인승)/
    ]

    for (const pattern of trimPatterns) {
      const match = afterModel.match(pattern)
      if (match) {
        return match[1]
      }
    }

    // 패턴 매칭 실패 시 모델명 이후 전체 반환
    if (afterModel.length > 0 && afterModel.length < 50) {
      return afterModel
    }
  }

  return null
}

/**
 * 차량명에서 라인업(연식+유종) 정보를 추출합니다.
 */
export function extractLineup(vehicleName: string): string | null {
  if (!vehicleName) return null
  const normalizedName = vehicleName.trim()

  // 유종 키워드
  const fuelTypes = ['가솔린', '디젤', 'HEV', 'PHEV', 'EV', 'LPG', '하이브리드', '전기']

  for (const fuel of fuelTypes) {
    if (normalizedName.includes(fuel)) {
      // 연식 패턴 (예: 24MY, 25MY, 2024)
      const yearMatch = normalizedName.match(/(\d{2,4})(?:MY|년)?/)
      if (yearMatch) {
        return `${yearMatch[1]}MY ${fuel}`
      }
      return fuel
    }
  }

  return null
}

/**
 * 차량명을 파싱하여 브랜드, 모델명, 트림, 라인업을 추출합니다.
 */
export function parseVehicleName(vehicleName: string): ParsedVehicle {
  if (!vehicleName) {
    return {
      brand: '기타',
      modelName: '알수없음',
      trim: null,
      lineup: null,
      originalName: ''
    }
  }
  const brand = extractBrand(vehicleName)
  const modelName = extractModelName(vehicleName, brand)
  const trim = extractTrim(vehicleName, modelName)
  const lineup = extractLineup(vehicleName)

  return {
    brand,
    modelName,
    trim,
    lineup,
    originalName: vehicleName
  }
}

/**
 * 브랜드명을 정규화합니다.
 */
export function normalizeBrand(brand: string): string {
  return BRAND_ALIASES[brand] || brand
}

/**
 * 모든 지원 브랜드 목록을 반환합니다.
 */
export function getAllBrands(): string[] {
  return Object.keys(BRAND_KEYWORDS)
}
