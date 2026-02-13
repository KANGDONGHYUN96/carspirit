// 차량별 기본 엔진 스펙 (배기량, 터보 여부)
const VEHICLE_ENGINE_SPECS: Record<string, { displacement: string; turbo: boolean }> = {
  // 기아 (정식명)
  '더 뉴 카니발': { displacement: '3.5', turbo: false },
  '더 뉴 카니발 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 스포티지': { displacement: '1.6', turbo: true },
  '더 뉴 스포티지 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 쏘렌토': { displacement: '2.5', turbo: true },
  '더 뉴 쏘렌토 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 K5': { displacement: '1.6', turbo: true },
  '더 뉴 K5 HEV': { displacement: '1.6', turbo: true },
  'The New K8': { displacement: '1.6', turbo: true },
  'The New K8 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 K9': { displacement: '3.5', turbo: false },
  '더 뉴 셀토스': { displacement: '1.6', turbo: true },
  '디 올 뉴 셀토스': { displacement: '1.6', turbo: true },
  '디 올 뉴 셀토스 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 모닝': { displacement: '1.0', turbo: false },
  '더 뉴 레이 PE': { displacement: '1.0', turbo: false },
  '디 올 뉴 니로 HEV': { displacement: '1.6', turbo: false },
  '디 올 뉴 니로 EV': { displacement: '', turbo: false },
  // 기아 (DB 단축명)
  '카니발': { displacement: '3.5', turbo: false },
  '카니발 HEV': { displacement: '1.6', turbo: true },
  '스포티지': { displacement: '1.6', turbo: true },
  '스포티지 HEV': { displacement: '1.6', turbo: true },
  '쏘렌토': { displacement: '2.5', turbo: true },
  '쏘렌토 HEV': { displacement: '1.6', turbo: true },
  'K5': { displacement: '1.6', turbo: true },
  'K5 HEV': { displacement: '1.6', turbo: true },
  'K8': { displacement: '1.6', turbo: true },
  'K8 HEV': { displacement: '1.6', turbo: true },
  '셀토스': { displacement: '1.6', turbo: true },
  '셀토스 HEV': { displacement: '1.6', turbo: true },
  '모닝': { displacement: '1.0', turbo: false },
  '레이': { displacement: '1.0', turbo: false },
  '레이 EV': { displacement: '', turbo: false },
  '니로 HEV': { displacement: '1.6', turbo: false },

  // 현대 (정식명)
  '더 뉴 아반떼': { displacement: '1.6', turbo: false },
  '더 뉴 아반떼 HEV': { displacement: '1.6', turbo: false },
  '더 뉴 아반떼 N': { displacement: '2.0', turbo: true },
  '쏘나타 디 엣지': { displacement: '1.6', turbo: true },
  '쏘나타 디 엣지 HEV': { displacement: '1.6', turbo: true },
  '디 올 뉴 그랜저': { displacement: '2.5', turbo: false },
  '디 올 뉴 그랜저 HEV': { displacement: '1.6', turbo: true },
  '더 뉴 투싼': { displacement: '1.6', turbo: true },
  '더 뉴 투싼 HEV': { displacement: '1.6', turbo: true },
  '디 올 뉴 싼타페': { displacement: '2.5', turbo: true },
  '디 올 뉴 싼타페 HEV': { displacement: '1.6', turbo: true },
  '디 올 뉴 팰리세이드': { displacement: '2.5', turbo: true },
  '디 올 뉴 팰리세이드 HEV': { displacement: '2.5', turbo: true },
  '더 뉴 캐스퍼': { displacement: '1.0', turbo: false },
  '베뉴': { displacement: '1.6', turbo: false },
  '디 올 뉴 코나': { displacement: '1.6', turbo: true },
  '디 올 뉴 코나 HEV': { displacement: '1.6', turbo: false },
  '디 올 뉴 코나 EV': { displacement: '', turbo: false },
  '더 뉴 스타리아': { displacement: '2.2', turbo: false },
  '더 뉴 스타리아 HEV': { displacement: '1.6', turbo: true },
  '스타리아': { displacement: '2.2', turbo: false },
  '스타리아 HEV': { displacement: '1.6', turbo: true },
  // 현대 (DB 단축명)
  '아반떼': { displacement: '1.6', turbo: false },
  '아반떼 HEV': { displacement: '1.6', turbo: false },
  '쏘나타': { displacement: '2.0', turbo: false },
  '쏘나타 HEV': { displacement: '2.0', turbo: false },
  '그랜저': { displacement: '2.5', turbo: false },
  '그랜저 HEV': { displacement: '1.6', turbo: true },
  '투싼': { displacement: '1.6', turbo: true },
  '투싼 HEV': { displacement: '1.6', turbo: true },
  '싼타페': { displacement: '2.5', turbo: true },
  '싼타페 HEV': { displacement: '1.6', turbo: true },
  '팰리세이드': { displacement: '2.5', turbo: true },
  '팰리세이드 HEV': { displacement: '2.5', turbo: true },
  '캐스퍼': { displacement: '1.0', turbo: false },
  '디 올 뉴 넥쏘': { displacement: '', turbo: false },
  '넥쏘 EV': { displacement: '', turbo: false },
  '넥쏘': { displacement: '', turbo: false },
  '포터2': { displacement: '2.5', turbo: true },
  '포터2 특장차': { displacement: '2.5', turbo: true },
  '포터2 Electric': { displacement: '', turbo: false },
  '포터': { displacement: '2.5', turbo: true },

  // 제네시스
  'G80': { displacement: '2.5', turbo: true },
  'GV80': { displacement: '2.5', turbo: true },
  '더 뉴 G70': { displacement: '2.0', turbo: true },
  'G70': { displacement: '2.0', turbo: true },
  'G70 슈팅브레이크': { displacement: '2.0', turbo: true },
  'GV60 마그마': { displacement: '', turbo: false },
  'GV60 F/L': { displacement: '', turbo: false },
  'GV60': { displacement: '', turbo: false },

  // 르노
  '그랑 콜레오스 HEV': { displacement: '1.5', turbo: false },

  // KGM
  '토레스': { displacement: '1.5', turbo: true },
  '토레스 HEV': { displacement: '1.5', turbo: true },
  '티볼리': { displacement: '1.5', turbo: false },
  '액티언 HEV': { displacement: '1.5', turbo: false },

  // 쉐보레
  '트랙스 크로스오버': { displacement: '1.2', turbo: true },
  '트레일블레이저': { displacement: '1.3', turbo: true },
}

// 터보 엔진이 존재하지 않는 모델 (잘못된 터보 표기 보정용)
// 캐스퍼는 1.0/1.0T 둘 다 존재하므로 포함하지 않음
const NEVER_TURBO_MODELS = new Set([
  '레이', '더 뉴 레이 PE', '레이 EV',
  '모닝', '더 뉴 모닝',
])

// 구동방식(2WD/4WD/AWD) 구분이 없는 모델
const NO_DRIVE_MODELS = new Set([
  '레이', '더 뉴 레이 PE', '레이 EV',
  '모닝', '더 뉴 모닝',
])

// 특정 배기량에서 터보가 없는 모델 (잘못된 터보 표기 보정)
// K8: 1.6T만 터보, 2.5/3.5는 자연흡기
const NA_DISPLACEMENTS: Record<string, Set<string>> = {
  'K8': new Set(['2.5', '3.5']),
  'K9': new Set(['3.5']),
  '그랜저': new Set(['2.5']),
}

// 인승 구분이 있는 모델 (키워드 포함 검사)
// 이 목록에 없는 모델은 인승을 라인업에서 제거 (5인승만 있는 스포티지 등)
const MULTI_SEAT_KEYWORDS = [
  '카니발', '팰리세이드', '싼타페', '쏘렌토', '스타리아',
  'GV80', '아이오닉9', '아이오닉 9',
]

// 라인업 문자열 파싱
interface ParsedLineup {
  year: string | null        // 2025년형, 2026년형
  fuel: string | null        // 가솔린, 디젤, 전기, LPG
  displacement: string | null // 1.0, 1.6, 2.5, 3.5
  turbo: boolean             // 터보 여부
  drive: string | null       // 2WD, 4WD, AWD, RWD
  seats: string | null       // 5인승, 7인승, 9인승
}

function parseLineup(lineup: string): ParsedLineup {
  const result: ParsedLineup = {
    year: null,
    fuel: null,
    displacement: null,
    turbo: false,
    drive: null,
    seats: null
  }

  if (!lineup) return result

  // 년형 추출
  const yearMatch = lineup.match(/(\d{4})년형/)
  if (yearMatch) result.year = yearMatch[0]

  // 연료 추출
  if (lineup.includes('하이브리드')) result.fuel = '하이브리드'
  else if (lineup.includes('가솔린')) result.fuel = '가솔린'
  else if (lineup.includes('디젤')) result.fuel = '디젤'
  else if (lineup.includes('전기')) result.fuel = '전기'
  else if (lineup.includes('LPG')) result.fuel = 'LPG'

  // 배기량 추출 (1.0, 1.5, 1.6, 2.0, 2.5, 3.5, 3.8 등)
  const displacementMatch = lineup.match(/(\d+\.\d+)/)
  if (displacementMatch) result.displacement = displacementMatch[1]

  // 터보 여부
  if (lineup.includes('터보') || lineup.includes('T ') || lineup.match(/\d+\.\d+T/)) {
    result.turbo = true
  }

  // 구동방식 추출 (4WD → AWD 통일)
  if (lineup.includes('AWD') || lineup.includes('4WD')) result.drive = 'AWD'
  else if (lineup.includes('2WD')) result.drive = '2WD'
  else if (lineup.includes('RWD')) result.drive = 'RWD'

  // 좌석수 추출
  const seatsMatch = lineup.match(/(\d+)인승/)
  if (seatsMatch) result.seats = seatsMatch[0]

  return result
}

/**
 * 라인업을 정규화합니다.
 * 누락된 배기량/터보 정보를 차량 스펙에서 가져와 보정합니다.
 */
export function normalizeLineup(lineup: string, vehicleName: string): string {
  if (!lineup) return ''

  const parsed = parseLineup(lineup)
  const spec = VEHICLE_ENGINE_SPECS[vehicleName]

  // 인승 구분이 있는 모델만 좌석수 표시
  const showSeats = parsed.seats && MULTI_SEAT_KEYWORDS.some(kw => vehicleName.includes(kw))

  // 전기차는 배기량 없음 (HEV는 제외 - 'EV'가 'HEV'에 매칭되지 않도록 주의)
  const isEV = parsed.fuel === '전기'
    || /\bEV\b/.test(vehicleName)
    || vehicleName.includes('일렉트릭')
    || vehicleName.includes('아이오닉')
  if (isEV && !vehicleName.includes('HEV')) {
    const parts = []
    if (parsed.year) parts.push(parsed.year)
    if (parsed.fuel) parts.push(parsed.fuel)
    // 테슬라는 구동방식 표시 안 함 (RWD/Long Range가 트림)
    const isTesla = /Model\s[3YSXE]/i.test(vehicleName)
    if (parsed.drive && !isTesla) parts.push(parsed.drive)
    if (showSeats) parts.push(parsed.seats!)
    return parts.join(' ')
  }

  // 터보 모델이 없는 차량의 잘못된 터보 표기 보정
  if (parsed.turbo && NEVER_TURBO_MODELS.has(vehicleName)) {
    parsed.turbo = false
  }

  // 특정 배기량에서 터보가 없는 모델 보정 (K8 2.5/3.5 등)
  if (parsed.turbo && parsed.displacement) {
    for (const [keyword, disps] of Object.entries(NA_DISPLACEMENTS)) {
      if (vehicleName.includes(keyword) && disps.has(parsed.displacement)) {
        parsed.turbo = false
        break
      }
    }
  }

  // 구동방식 구분이 없는 차량의 잘못된 구동방식 제거
  if (parsed.drive && NO_DRIVE_MODELS.has(vehicleName)) {
    parsed.drive = null
  }

  // 배기량이 없으면 차량 스펙에서 가져오기
  if (!parsed.displacement && spec?.displacement) {
    parsed.displacement = spec.displacement
    // 스펙에서 배기량을 가져온 경우, 터보도 스펙 기준으로 적용
    if (spec.turbo) parsed.turbo = true
  } else if (spec?.turbo && parsed.displacement === spec.displacement) {
    // 배기량이 스펙과 동일한 경우만 터보 적용
    // (다른 배기량은 터보 여부가 다를 수 있음: 카니발 1.6T vs 3.5 NA)
    parsed.turbo = true
  }

  // 정규화된 라인업 문자열 생성
  const parts = []
  if (parsed.year) parts.push(parsed.year)
  if (parsed.fuel) parts.push(parsed.fuel)
  if (parsed.displacement) {
    parts.push(parsed.turbo ? `${parsed.displacement}T` : parsed.displacement)
  }
  if (parsed.drive) parts.push(parsed.drive)
  if (showSeats) parts.push(parsed.seats!)

  return parts.join(' ')
}

/**
 * 두 라인업이 실질적으로 같은지 비교합니다.
 */
export function isSameLineup(lineup1: string, lineup2: string, vehicleName: string): boolean {
  const norm1 = normalizeLineup(lineup1, vehicleName)
  const norm2 = normalizeLineup(lineup2, vehicleName)
  return norm1 === norm2
}
