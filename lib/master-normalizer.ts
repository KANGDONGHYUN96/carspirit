/**
 * 마스터데이터 기반 정규화 모듈
 *
 * 브랜드별 JSON 마스터데이터(kia.json, hyundai.json, genesis.json, renault.json, kgm.json)와
 * master_data.json의 정규화 규칙을 기준으로 옵션, 외장색, 내장색을 정규화합니다.
 */

import masterData from '../master_data.json'
import kiaData from '../kia.json'
import hyundaiData from '../hyundai.json'
import genesisData from '../genesis.json'
import renaultData from '../renault.json'
import kgmData from '../kgm.json'

// === 비교용 키 정규화 ===
function normKey(s: string): string {
  let key = s.replace(/\s+/g, '')
  key = key.replace(/®/g, '')
  // 로마숫자 → 아라비아숫자
  key = key.replace(/Ⅳ/g, '4').replace(/Ⅲ/g, '3').replace(/Ⅱ/g, '2').replace(/Ⅰ/g, '1')
  key = key.replace(/(?<=[가-힣])III/g, '3').replace(/(?<=[가-힣])II/g, '2').replace(/(?<=[가-힣])I(?![a-zA-Z])/g, '1')
  // Plus/플러스 → +
  key = key.replace(/Plus$/i, '+').replace(/플러스$/, '+')
  // 소문자 통일 (영문)
  return key.toLowerCase()
}

// === JSON 구조에서 차량 객체를 재귀 탐색 ===
interface VehicleData {
  official_name?: string
  options?: string[]
  exterior_colors?: Record<string, string>
  interior_colors?: string[]
  garnish?: string[]
  [key: string]: unknown
}

function flattenVehicles(obj: Record<string, unknown>): VehicleData[] {
  const result: VehicleData[] = []
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>
      if ('official_name' in v) {
        result.push(v as VehicleData)
      } else {
        result.push(...flattenVehicles(v))
      }
    }
  }
  return result
}

// === 옵션 정규화 맵 빌드 ===
// variant(normKey) → official name
const optionNormMap = new Map<string, string>()

interface NormEntry { official: string; variants?: string[] }
type NormData = Record<string, string | NormEntry>

function addOptionNorms(norms: NormData) {
  for (const [key, val] of Object.entries(norms)) {
    if (key.startsWith('_')) continue
    const official = typeof val === 'string' ? key : val.official
    const variants = typeof val === 'string' ? [] : (val.variants || [])

    optionNormMap.set(normKey(official), official)
    for (const v of variants) {
      optionNormMap.set(normKey(v), official)
    }
  }
}

// master_data.json 옵션 정규화 규칙
addOptionNorms(masterData.option_normalizations as unknown as NormData)
// kia.json 옵션 정규화 규칙
const kiaAny = kiaData as Record<string, unknown>
if (kiaAny.option_normalizations) {
  addOptionNorms(kiaAny.option_normalizations as NormData)
}

// 각 브랜드별 차량의 공식 옵션명 수집
const allBrandVehicles = [
  ...flattenVehicles((kiaAny.vehicles || {}) as Record<string, unknown>),
  ...flattenVehicles(hyundaiData.vehicles as unknown as Record<string, unknown>),
  ...flattenVehicles((genesisData as Record<string, unknown>).vehicles as Record<string, unknown>),
  ...flattenVehicles((renaultData as Record<string, unknown>).vehicles as Record<string, unknown>),
  ...flattenVehicles((kgmData as Record<string, unknown>).vehicles as Record<string, unknown>),
]

for (const vehicle of allBrandVehicles) {
  if (vehicle.options && Array.isArray(vehicle.options)) {
    for (const opt of vehicle.options) {
      const k = normKey(opt)
      if (!optionNormMap.has(k)) {
        optionNormMap.set(k, opt)
      }
    }
  }
}

// === 외장색 정규화 맵 빌드 ===
// code/variant(normKey) → official Korean name
const extColorNormMap = new Map<string, string>()
// 모든 공식 색상명 (normKey) - 옵션에서 색상 필터링용
const allOfficialColorKeys = new Set<string>()

// master_data.json 색상코드 매핑
for (const [code, name] of Object.entries(masterData.exterior_color_normalizations)) {
  if (code.startsWith('_')) continue
  if (typeof name === 'string') {
    extColorNormMap.set(normKey(code), name)
    allOfficialColorKeys.add(normKey(name))
  }
}

// 각 차량의 외장색 수집
for (const vehicle of allBrandVehicles) {
  if (vehicle.exterior_colors && typeof vehicle.exterior_colors === 'object') {
    for (const [codeOrName, value] of Object.entries(vehicle.exterior_colors)) {
      if (typeof value !== 'string') continue
      // 색상코드(3-4자 영문숫자) → Korean name (기아/현대 형식)
      if (/^[A-Z][A-Z0-9]{1,3}$/.test(codeOrName)) {
        extColorNormMap.set(normKey(codeOrName), value)
        allOfficialColorKeys.add(normKey(value))
        // 한국어명 self-mapping (공백 정규화: "인터스텔라그레이" → "인터스텔라 그레이")
        extColorNormMap.set(normKey(value), value)
      } else {
        // Korean name → English name (제네시스/KGM/르노 형식)
        allOfficialColorKeys.add(normKey(codeOrName))
        // 한국어명 self-mapping (공백 정규화: "우유니화이트" → "우유니 화이트")
        extColorNormMap.set(normKey(codeOrName), codeOrName)
        // 영문명 → 한국어명 매핑
        extColorNormMap.set(normKey(value), codeOrName)
      }
    }
  }
}

// === 외장색 오타 보정 (금융사 데이터의 빈번한 오타) ===
const EXT_COLOR_TYPOS: Record<string, string> = {
  '세레이티': '세레니티',
}
for (const [typo, correct] of Object.entries(EXT_COLOR_TYPOS)) {
  // 오타 키워드를 포함하는 모든 공식 색상명 찾기
  for (const [, officialName] of extColorNormMap) {
    if (officialName.includes(correct)) {
      const typoName = officialName.replace(correct, typo)
      extColorNormMap.set(normKey(typoName), officialName)
    }
  }
}

// === 내장색 정규화 맵 빌드 ===
const intColorNormMap = new Map<string, string>()

// master_data.json 내장색 정규화
for (const [key, val] of Object.entries(masterData.interior_color_normalizations)) {
  if (key.startsWith('_')) continue
  if (typeof val === 'object' && val !== null) {
    const entry = val as NormEntry
    intColorNormMap.set(normKey(entry.official), entry.official)
    for (const v of (entry.variants || [])) {
      intColorNormMap.set(normKey(v), entry.official)
    }
  }
}

// 각 차량의 내장색 수집 (공식명 그대로)
for (const vehicle of allBrandVehicles) {
  if (vehicle.interior_colors && Array.isArray(vehicle.interior_colors)) {
    for (const color of vehicle.interior_colors) {
      const k = normKey(color)
      if (!intColorNormMap.has(k)) {
        intColorNormMap.set(k, color)
      }
    }
  }
}

// === 공개 API ===

/**
 * 옵션명을 마스터데이터 기준으로 정규화
 * @param cleaned 기본 정리가 완료된 옵션명
 * @returns 마스터데이터의 공식 옵션명 또는 입력값 그대로
 */
export function lookupOption(cleaned: string): string {
  const k = normKey(cleaned)
  return optionNormMap.get(k) || cleaned
}

/**
 * 문자열이 공식 색상명인지 판별 (옵션에서 색상 필터링용)
 */
export function isKnownColorName(opt: string): boolean {
  return allOfficialColorKeys.has(normKey(opt))
}

/**
 * 외장색을 마스터데이터 기준으로 정규화
 * 색상코드(AGT, SWP 등) 또는 변형 표기를 공식명으로 변환
 */
export function lookupExtColor(cleaned: string): string {
  const k = normKey(cleaned)
  return extColorNormMap.get(k) || cleaned
}

/**
 * 내장색을 마스터데이터 기준으로 정규화
 */
export function lookupIntColor(cleaned: string): string {
  const k = normKey(cleaned)
  return intColorNormMap.get(k) || cleaned
}

// === 한국어 일반 색상명 → 공식 색상 매칭용 키워드 ===
const GENERIC_COLOR_KEYWORDS: Record<string, string[]> = {
  '흰색': ['화이트', 'white'],
  '순백색': ['화이트', 'white'],
  '백색': ['화이트', 'white'],
  '검정색': ['블랙', 'black'],
  '검정': ['블랙', 'black'],
  '은색': ['실버', 'silver'],
  '회색': ['그레이', 'gray', 'grey'],
  '빨간색': ['레드', 'red'],
  '파란색': ['블루', 'blue'],
}

// === 모델별 내장색 정규화 ===
// normKey(modelName) → interior colors list
const modelIntColorsMap = new Map<string, string[]>()

// === 모델별 외장색 정규화 ===
// normKey(modelName) → exterior color names list
const modelExtColorsMap = new Map<string, string[]>()

// === 모델별 가니쉬 ===
// normKey(modelName) → garnish names list
const modelGarnishMap = new Map<string, string[]>()

function registerModelNames(name: string, intColors: string[] | null, extColors: string[] | null, garnish: string[] | null = null) {
  if (intColors && intColors.length > 0) {
    modelIntColorsMap.set(normKey(name), intColors)
  }
  if (extColors && extColors.length > 0) {
    modelExtColorsMap.set(normKey(name), extColors)
  }
  if (garnish && garnish.length > 0) {
    modelGarnishMap.set(normKey(name), garnish)
  }
  // HEV ↔ 하이브리드 variants
  const hev = name.replace(/하이브리드/g, 'HEV')
  if (hev !== name) {
    if (intColors && intColors.length > 0) modelIntColorsMap.set(normKey(hev), intColors)
    if (extColors && extColors.length > 0) modelExtColorsMap.set(normKey(hev), extColors)
    if (garnish && garnish.length > 0) modelGarnishMap.set(normKey(hev), garnish)
  }
  const hybrid = name.replace(/\bHEV\b/g, '하이브리드')
  if (hybrid !== name) {
    if (intColors && intColors.length > 0) modelIntColorsMap.set(normKey(hybrid), intColors)
    if (extColors && extColors.length > 0) modelExtColorsMap.set(normKey(hybrid), extColors)
    if (garnish && garnish.length > 0) modelGarnishMap.set(normKey(hybrid), garnish)
  }
}

function registerModelColors(key: string, vehicle: VehicleData & { aliases?: string[] }) {
  const intColors = vehicle.interior_colors && vehicle.interior_colors.length > 0 ? vehicle.interior_colors : null
  const extColorNames = vehicle.exterior_colors
    ? (Object.values(vehicle.exterior_colors).filter(v => typeof v === 'string') as string[])
    : null
  const garnish = vehicle.garnish && vehicle.garnish.length > 0 ? vehicle.garnish : null

  const names = [key]
  if (vehicle.official_name) names.push(vehicle.official_name)
  if (vehicle.aliases) names.push(...vehicle.aliases)

  for (const name of names) {
    registerModelNames(name, intColors, extColorNames, garnish)
  }
}

function walkVehicleEntries(obj: Record<string, unknown>) {
  for (const [key, val] of Object.entries(obj)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue
    const v = val as Record<string, unknown>
    if ('interior_colors' in v || 'exterior_colors' in v) {
      registerModelColors(key, v as VehicleData & { aliases?: string[] })
    } else {
      walkVehicleEntries(v)
    }
  }
}

walkVehicleEntries((kiaData as Record<string, unknown>).vehicles as Record<string, unknown> || {})
walkVehicleEntries(hyundaiData.vehicles as unknown as Record<string, unknown>)
walkVehicleEntries((genesisData as Record<string, unknown>).vehicles as Record<string, unknown> || {})
walkVehicleEntries((renaultData as Record<string, unknown>).vehicles as Record<string, unknown> || {})
walkVehicleEntries((kgmData as Record<string, unknown>).vehicles as Record<string, unknown> || {})

// === 모델별 외장색 정규화 ===

function findModelExtColors(modelName: string): string[] | null {
  const base = modelName.replace(/\s*F\/L\s*$/i, '').trim()
  const tries = [
    modelName,
    base,
    modelName.replace(/\s*HEV\s*$/i, ' 하이브리드').trim(),
    modelName.replace(/^(더 뉴|디 올 뉴)\s+/, ''),
  ]
  const stripped = modelName.replace(/^(더 뉴|디 올 뉴)\s+/, '')
  tries.push(stripped.replace(/\s*HEV\s*$/i, ' 하이브리드').trim())

  for (const name of tries) {
    const colors = modelExtColorsMap.get(normKey(name))
    if (colors) return colors
  }
  return null
}

/**
 * 모델별 외장색 정규화
 * 금융사 일반 표기(흰색, 순백색 등)를 모델 공식 외장색으로 변환
 */
export function lookupExtColorForModel(color: string, modelName: string): string {
  if (!color || !modelName) return lookupExtColor(color)

  // 글로벌 정규화 먼저 적용
  const globally = lookupExtColor(color)

  const modelColors = findModelExtColors(modelName)
  if (!modelColors || modelColors.length === 0) return globally

  // 글로벌 결과가 모델 공식 색상이면 바로 반환
  const gk = normKey(globally)
  if (modelColors.some(mc => normKey(mc) === gk)) return globally

  // 한국어 일반 색상명 → 모델 공식 색상 매칭
  const input = normKey(color)
  const keywords = GENERIC_COLOR_KEYWORDS[color.trim()] || GENERIC_COLOR_KEYWORDS[globally]
  if (keywords) {
    const matches = modelColors.filter(mc => {
      const mck = normKey(mc)
      return keywords.some(kw => mck.includes(normKey(kw)))
    })
    if (matches.length === 1) return matches[0]
  }

  // 입력값이 모델 공식 색상의 부분 문자열인 경우 (유일 매칭)
  const subMatches = modelColors.filter(mc => normKey(mc).includes(input))
  if (subMatches.length === 1) return subMatches[0]

  return globally
}

// 금융사 내장색 → 표준 색상 별칭
const INT_COLOR_BASE_ALIASES: Record<string, string> = {
  '다크차콜': '블랙',
  '다크 차콜': '블랙',
  '차콜': '블랙',
  '인디고': '네이비',
  '피칸 브라운': '브라운',
  '피칸브라운': '브라운',
}

const TONE_SUFFIX_RE = /\s*(원톤|투톤|모노톤)\s*$/

// 기본 색상명 (두 단어 조합 시 투톤 판별용)
const BASE_COLORS = new Set([
  '블랙', '화이트', '그레이', '브라운', '베이지', '네이비',
  '레드', '블루', '그린', '인디고', '버건디', '카키',
  '차콜', '크림', '아이보리', '샌드', '민트', '퍼플',
])

function findModelIntColors(modelName: string): string[] | null {
  const base = modelName.replace(/\s*F\/L\s*$/i, '').trim()
  const tries = [
    modelName,
    base,
    modelName.replace(/\s*HEV\s*$/i, ' 하이브리드').trim(),
    modelName.replace(/^(더 뉴|디 올 뉴)\s+/, ''),
  ]
  const stripped = modelName.replace(/^(더 뉴|디 올 뉴)\s+/, '')
  tries.push(stripped.replace(/\s*HEV\s*$/i, ' 하이브리드').trim())

  for (const name of tries) {
    const colors = modelIntColorsMap.get(normKey(name))
    if (colors) return colors
  }
  return null
}

/** 내장색 비교용 키 (원톤=모노톤 동등 처리) */
function intColorKey(s: string): string {
  return normKey(s).replace(/원톤/g, '모노톤')
}

/** intColorKey 기준으로 모델 색상과 매칭 시도 */
function tryMatchModel(candidate: string, modelColors: string[]): string | null {
  const ck = intColorKey(candidate)
  for (const mc of modelColors) {
    if (intColorKey(mc) === ck) return mc
  }
  return null
}

/**
 * 모델별 내장색 정규화
 * 금융사 표기를 모델 공식 내장색으로 변환
 *
 * 처리 규칙:
 * - "블랙 블랙" → "블랙 모노톤" (같은 색 반복 = 모노톤)
 * - "블랙 원톤" → "블랙 모노톤" (원톤 = 모노톤)
 * - "블랙" → "블랙 모노톤" (단일 색상 → 모노톤 추정)
 * - "인디고 브라운" → "인디고 브라운 투톤" (두 색상 = 투톤)
 * - "피칸브라운" → "브라운 투톤" (별칭 적용)
 */
export function lookupIntColorForModel(color: string, modelName: string): string {
  if (!color || !modelName) return lookupIntColor(color)

  // === Phase 1: 전처리 ===
  let c = color

  // 1-a. "X X" (같은 색 반복) → "X 모노톤"
  const words = c.split(/\s+/)
  if (words.length === 2 && normKey(words[0]) === normKey(words[1])) {
    c = `${words[0]} 모노톤`
  }

  // 1-b. 두 기본 색상 단어 (톤 접미사 없음) → 투톤 추정
  //      예: "인디고 브라운" → "인디고 브라운 투톤"
  //      단, "라이트 그레이"(수식어+색상)는 제외
  const cWords = c.split(/\s+/)
  if (cWords.length === 2 && !TONE_SUFFIX_RE.test(c)) {
    if (BASE_COLORS.has(cWords[0]) && BASE_COLORS.has(cWords[1])) {
      c = `${c} 투톤`
    }
  }

  // === Phase 2: 모델별 매칭 ===
  const modelColors = findModelIntColors(modelName)

  if (!modelColors || modelColors.length === 0) {
    // 모델 데이터 없음 → 원톤→모노톤, 단일 기본색→모노톤
    c = c.replace(/원톤/g, '모노톤')
    if (!TONE_SUFFIX_RE.test(c) && BASE_COLORS.has(c)) {
      c = `${c} 모노톤`
    }
    return lookupIntColor(c)
  }

  // 2-a. 직접 매칭
  const direct = tryMatchModel(c, modelColors)
  if (direct) return direct

  // 2-b. 톤 접미사 없으면 모노톤/투톤 시도
  if (!TONE_SUFFIX_RE.test(c)) {
    for (const suffix of ['모노톤', '투톤']) {
      const m = tryMatchModel(`${c} ${suffix}`, modelColors)
      if (m) return m
    }
  }

  // 2-c. 톤 접미사 제거 → 베이스 색상으로 매칭
  const baseColor = c.replace(TONE_SUFFIX_RE, '').trim()
  if (baseColor && baseColor !== c) {
    const baseMatches = modelColors.filter(mc => {
      const mcBase = mc.replace(TONE_SUFFIX_RE, '').trim()
      return intColorKey(mcBase) === intColorKey(baseColor)
    })
    if (baseMatches.length === 1) return baseMatches[0]
  }

  // 2-d. 별칭 매핑 (피칸 브라운→브라운, 인디고→네이비 등)
  const effectiveBase = baseColor || c
  const noSpace = effectiveBase.replace(/\s+/g, '')
  const aliased = INT_COLOR_BASE_ALIASES[effectiveBase] || INT_COLOR_BASE_ALIASES[noSpace]
  if (aliased) {
    // 별칭으로 직접/모노톤/투톤 시도
    const m0 = tryMatchModel(aliased, modelColors)
    if (m0) return m0
    for (const suffix of ['모노톤', '투톤']) {
      const m = tryMatchModel(`${aliased} ${suffix}`, modelColors)
      if (m) return m
    }
    // 별칭 베이스 매칭
    const aliasMatches = modelColors.filter(mc => {
      const mcBase = mc.replace(TONE_SUFFIX_RE, '').trim()
      return intColorKey(mcBase) === intColorKey(aliased)
    })
    if (aliasMatches.length === 1) return aliasMatches[0]
  }

  // 2-e. 첫 번째 단어 별칭 치환 후 재시도
  //      예: "인디고 브라운 투톤" → "네이비 브라운 투톤"
  const firstWord = c.split(/\s+/)[0]
  const firstAlias = INT_COLOR_BASE_ALIASES[firstWord]
  if (firstAlias && firstAlias !== firstWord) {
    const replaced = c.replace(firstWord, firstAlias)
    const m = tryMatchModel(replaced, modelColors)
    if (m) return m
    // 치환 후 베이스 매칭
    const replacedBase = replaced.replace(TONE_SUFFIX_RE, '').trim()
    const repMatches = modelColors.filter(mc => {
      const mcBase = mc.replace(TONE_SUFFIX_RE, '').trim()
      return intColorKey(mcBase) === intColorKey(replacedBase)
    })
    if (repMatches.length === 1) return repMatches[0]
  }

  // 2-f. 마지막 색상 단어로 퍼지 매칭 (고유 매칭일 때만)
  const inputBase = (baseColor || c.replace(TONE_SUFFIX_RE, '').trim())
  const colorWords = inputBase.split(/\s+/).filter(w => BASE_COLORS.has(w))
  if (colorWords.length > 0) {
    const lastCW = colorWords[colorWords.length - 1]
    const fuzzy = modelColors.filter(mc => {
      const mcBase = mc.replace(TONE_SUFFIX_RE, '').trim()
      return intColorKey(mcBase).includes(intColorKey(lastCW))
    })
    if (fuzzy.length === 1) return fuzzy[0]
  }

  // 2-g. 부분 문자열 포함
  const subMatches = modelColors.filter(mc => mc.includes(c) && mc !== c)
  if (subMatches.length === 1) return subMatches[0]

  // 2-h. normKey 기반 부분 문자열 매칭 (공백/표기 차이 무시)
  // 예: "블랙 모노톤" → "옵시디언 블랙 모노톤", "옵시디언블랙모노톤" → "옵시디언 블랙 모노톤"
  const ck = intColorKey(c)
  if (ck.length >= 3) {
    const normSubMatches = modelColors.filter(mc => intColorKey(mc).includes(ck))
    if (normSubMatches.length === 1) return normSubMatches[0]
  }

  // 2-i. 모노톤/투톤 추가 후 normKey 부분 문자열 매칭
  // 예: "블랙" → "블랙모노톤" → "옵시디언 블랙 모노톤"의 서브스트링
  if (!TONE_SUFFIX_RE.test(c)) {
    for (const suffix of ['모노톤', '투톤']) {
      const ckWithSuffix = intColorKey(`${c} ${suffix}`)
      const nsm = modelColors.filter(mc => intColorKey(mc).includes(ckWithSuffix))
      if (nsm.length === 1) return nsm[0]
    }
  }

  // 2-j. 투톤 "/" 색상어 매칭 (G90 약어: "브라운/화이트" → "어반 브라운/글레이셔 화이트 투톤")
  if (c.includes('/')) {
    const colorParts = c.split('/').map(p => normKey(p.trim()))
    const slashMatches = modelColors.filter(mc => {
      const mck = normKey(mc)
      return colorParts.every(part => mck.includes(part)) && mck.includes('/')
    })
    if (slashMatches.length === 1) return slashMatches[0]
  }

  // Fallback: 전처리 결과에 글로벌 룩업
  return lookupIntColor(c)
}

// === 모델별 가니쉬 정규화 ===

function findModelGarnish(modelName: string): string[] | null {
  const base = modelName.replace(/\s*F\/L\s*$/i, '').trim()
  const tries = [
    modelName,
    base,
    modelName.replace(/^(더 뉴|디 올 뉴)\s+/, ''),
  ]
  for (const name of tries) {
    const list = modelGarnishMap.get(normKey(name))
    if (list) return list
  }
  return null
}

/**
 * 모델별 가니쉬 정규화
 * DB 표기(공백 누락 등)를 마스터데이터 공식 가니쉬명으로 변환
 *
 * @returns 매칭된 공식 가니쉬명, 또는 매칭 실패 시 null
 */
export function lookupGarnishForModel(garnish: string, modelName: string): string | null {
  if (!garnish || !modelName) return null

  const garnishList = findModelGarnish(modelName)
  if (!garnishList || garnishList.length === 0) return null

  const gk = normKey(garnish)

  // 정확 매칭 (공백/대소문자 무시)
  for (const g of garnishList) {
    if (normKey(g) === gk) return g
  }

  // 부분 문자열 매칭 (입력이 공식명에 포함되거나 그 반대)
  const subMatches = garnishList.filter(g => {
    const gNorm = normKey(g)
    return gNorm.includes(gk) || gk.includes(gNorm)
  })
  if (subMatches.length === 1) return subMatches[0]

  return null
}
