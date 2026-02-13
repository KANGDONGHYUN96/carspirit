'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { InstantDeliveryVehicle } from '@/types/instant-delivery'
import { getSourceLogoPath, getBrandLogoPath, getOfficialModelName } from '@/lib/utils/image-mapper'
import { parseVehicleName } from '@/lib/utils/vehicle-parser'
import { normalizeLineup } from '@/lib/utils/lineup-normalizer'
import { lookupOption, lookupExtColor, lookupExtColorForModel, lookupIntColor, lookupIntColorForModel, isKnownColorName, lookupGarnishForModel } from '@/lib/master-normalizer'
import { createClient } from '@/lib/supabase/client'

interface FilterState {
  source: string[]
  productType: string[]
  saleCondition: string[]
  lineup: string[]
  trim: string[]
  options: string[]
  exteriorColor: string[]
  interiorColor: string[]
}

interface VehicleDetailClientProps {
  modelName: string
}

export default function VehicleDetailClient({ modelName }: VehicleDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as 'special' | 'dealer' | null

  // 상태 관리
  const [vehicles, setVehicles] = useState<InstantDeliveryVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 한글↔영문 모델명 대체 키워드 (DB에 영문으로 저장된 경우 대비)
  const MODEL_SEARCH_ALIASES: Record<string, string> = {
    '타스만': 'Tasman',
    'Tasman': '타스만',
  }

  // 공식 모델명에서 핵심 검색 키워드 추출 (서버사이드 rough 필터용)
  const getModelSearchKeyword = (officialName: string): string => {
    return officialName
      .replace(/^(더 뉴|디 올 뉴|The New|All New|신형|New)\s+/gi, '')
      .split(/\s+/)[0]
  }

  // Supabase에서 해당 모델 차량 데이터 가져오기
  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const searchKeyword = getModelSearchKeyword(modelName)
        const aliasKeyword = MODEL_SEARCH_ALIASES[searchKeyword]

        // 서버사이드 필터링: 카테고리 + 모델 키워드 rough 매칭
        let allVehicles: InstantDeliveryVehicle[] = []
        let from = 0
        const pageSize = 1000

        while (true) {
          let query = supabase
            .from('instant_delivery_vehicles_v2')
            .select('*')

          // 한글↔영문 대체 키워드가 있으면 OR 검색
          if (aliasKeyword) {
            query = query.or(`vehicle_name.ilike.%${searchKeyword}%,vehicle_name.ilike.%${aliasKeyword}%`)
          } else {
            query = query.ilike('vehicle_name', `%${searchKeyword}%`)
          }

          query = query.order('created_at', { ascending: false })

          // 서버사이드 카테고리 필터링
          if (categoryParam === 'special') {
            query = query.or('category.eq.regular,category.eq.special,category.is.null')
          } else if (categoryParam === 'dealer') {
            query = query.eq('category', 'dealer')
          }

          const { data, error: fetchError } = await query
            .range(from, from + pageSize - 1)

          if (fetchError) {
            console.error('Supabase fetch error:', fetchError)
            setError(fetchError.message)
            break
          }

          if (!data || data.length === 0) {
            break
          }

          allVehicles = [...allVehicles, ...data]
          from += pageSize

          if (data.length < pageSize) {
            break
          }
        }

        // 클라이언트에서 정밀 모델 매칭 (rough 필터 후 소수만 남음)
        const filteredByModel = allVehicles.filter(v => {
          if (!v.vehicle_name) return false
          const brand = v.brand || parseVehicleName(v.vehicle_name).brand
          const officialName = getOfficialModelName(brand, v.vehicle_name)
          return officialName === modelName || v.vehicle_name === modelName
        })

        console.log(`${modelName} 모델: 서버 ${allVehicles.length}건 → 정밀매칭 ${filteredByModel.length}대`)
        setVehicles(filteredByModel)
      } catch (err) {
        console.error('Error fetching vehicles:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [modelName])

  // 브랜드 정보
  const brandInfo = useMemo(() => {
    if (vehicles.length === 0) return { brand: '기타', logo: '' }
    const first = vehicles[0]
    const brand = first.brand || parseVehicleName(first.vehicle_name).brand
    return {
      brand,
      logo: getBrandLogoPath(brand)
    }
  }, [vehicles])

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    source: [],
    productType: [],
    saleCondition: [],
    lineup: [],
    trim: [],
    options: [],
    exteriorColor: [],
    interiorColor: [],
  })

  // 옵션 문자열을 개별 항목으로 분리하는 헬퍼 함수
  const splitOptions = (optionsStr: string | null): string[] => {
    if (!optionsStr) return []
    // [파츠:...] 등 대괄호 패턴 제거
    let cleaned = optionsStr.replace(/\[.*?\]/g, '')
    // 줄바꿈은 워드랩일 수 있으므로 제거 (구분자 아님)
    cleaned = cleaned.replace(/\n/g, '')
    // 마침표 구분자: "빌트인 캠 2. 증강현실" → 2개로 분리 (T.G.L, 12.3 등 보호: 공백+한글 필수)
    cleaned = cleaned.replace(/\.(?=\s+[가-힣])/g, ',')
    // "A/T", "F/L" 등 대문자/대문자 약어 보호
    cleaned = cleaned.replace(/([A-Z])\/([A-Z])/g, '$1\u0000$2')
    // "," 또는 "/" 로 분리
    return cleaned
      .split(/[,\/]/)
      .map(opt => opt.replace(/\u0000/g, '/').trim())
      .filter(opt => opt.length > 0)
  }

  // 옵션 이름 정규화 (마스터데이터 기준 + 데이터 파편 정리)
  // 내장색명이 옵션명 앞에 붙어있는 경우 제거 (금융사 데이터 특성)
  // "블랙기본" → "기본", "캐러멜드라이브와이즈" → "드라이브와이즈"
  const INT_COLOR_OPTION_PREFIXES = ['블랙', '캐러멜', '네이비', '브라운', '그레이', '베이지', '인디고', '미드나잇그린', '라이트그레이']

  const normalizeOptionName = (opt: string): string => {
    let s = opt.trim().replace(/\s+/g, ' ')
    // (가니쉬) 접두사 → 가니쉬 항목 제외 (제네시스: 가니쉬가 옵션 필드에 포함됨)
    if (s.startsWith('(가니쉬)')) return ''
    // "기본형" 접두사 제거
    s = s.replace(/^기본형\s*/, '')
    // 내장색+옵션 결합 문자열에서 색상 접두사 제거
    const noSpace = s.replace(/\s+/g, '')
    for (const prefix of INT_COLOR_OPTION_PREFIXES) {
      if (noSpace.startsWith(prefix) && noSpace.length > prefix.length) {
        s = noSpace.slice(prefix.length)
        break
      }
    }
    // "*블랙박스..." 등 별표 주석 제거
    s = s.replace(/\s*\*.*$/, '')
    // HTML 엔티티 정리: &reg; → ®
    s = s.replace(/&reg;/gi, '®')
    // 매칭된 괄호 내용 모두 제거 (중간/끝 위치 무관)
    s = s.replace(/\s*\(.*?\)/g, '')
    // 미매칭 여는 괄호 이후 제거: "BOSE 프리미엄 사운드(12스피커" → "BOSE 프리미엄 사운드"
    s = s.replace(/\s*\([^)]*$/, '')
    // 미매칭 닫는 괄호 제거: "LED T.G.L)" → "LED T.G.L"
    s = s.replace(/\)/, '')
    // 말미 마침표 제거: "파퓰러1." → "파퓰러1"
    s = s.replace(/\.\s*$/, '')
    // 브랜드명 통일: Bose → BOSE
    s = s.replace(/\bBose\b/g, 'BOSE')
    // 오타 수정: 실드 → 쉴드 (windshield)
    s = s.replace(/실드/g, '쉴드')
    // 줄바꿈 잔해 보정
    s = s.replace(/디스 플레이/g, '디스플레이')
    // 오타 수정: 컨트럴 → 컨트롤
    s = s.replace(/컨트럴/g, '컨트롤')
    // 공백 정규화
    s = s.trim().replace(/\s+/g, ' ')
    // 마스터데이터에서 공식 옵션명 조회 (공백/로마숫자/대소문자 무시)
    s = lookupOption(s)
    return s
  }

  // 옵션에서 색상명 필터링 (마스터데이터의 모든 공식 색상명 기준)
  const isColorOption = (opt: string): boolean => {
    return isKnownColorName(opt)
  }

  // 필터에서 제외할 의미없는 옵션 (변속기, 순수 사이즈, 데이터 파편 등)
  const EXCLUDED_OPTIONS = new Set([
    'A/T', 'AWD', '오토',                // 변속기/구동방식
    '무옵션', '유료내장색상', '기본',          // 메타 정보
    '서비스', '파츠 전용', '외장 앰프',       // 데이터 파편 (파츠전용→spacing후 파츠 전용)
    '문엣지ppf', 'LED T.G.L',            // 데이터 파편
    'SDS1', 'SDS2', 'PLUS', 'NAPPA',     // 의미없는 코드/단어
    '265', '내비게이션', '모니터링', '룸미러', // 단독 일반명사
    '하만', '프리미엄스피커', '크렐사운드', '프리미엄',   // 애매한 단축명/트림명
    '블랙박스 SF500',                     // 블랙박스
    'BOSE사운드',                         // 불완전 약어 (BOSE 프리미엄 사운드가 정식)
    '필수 선택 사양 - 265',                // GV80 필수선택 (의미없음)
    '빌트인 캠2프리뷰전자제어서스펜션',       // 깨진 병합 데이터
    '빌트인',                              // 잘린 데이터 파편 (빌트인 캠/빌트인 캠 2의 일부)
    '인치휠',                              // 잘린 데이터 파편 (19인치 휠 등에서 분리된 잔해)
    '트인캠2',                             // 잘린 데이터 파편 (빌트인캠2에서 잘림)
    '컴포',                                // 잘린 데이터 파편 (컴포트에서 잘림)
    '프리미엄사운드',                       // 잘린 데이터 파편 (KRELL/BOSE 프리미엄 사운드에서 잘림)
    '파츠전용',                            // 파츠 전용 (공백없는 버전)
    '버텍스 500 15%',                     // 틴팅 제품 (옵션 아님)
  ])
  const isJunkOption = (opt: string): boolean => {
    if (EXCLUDED_OPTIONS.has(opt)) return true
    // 순수 사이즈: "16인치", "20인치", "18"" 등
    if (/^\d+인치$/.test(opt) || /^\d+"$/.test(opt)) return true
    // 별표로 시작하는 틴팅/서비스
    if (/^\*/.test(opt)) return true
    // 단일 영문 대문자 (A, T - A/T 분리 잔해)
    if (/^[A-Z]$/.test(opt)) return true
    // 2글자 이하 한글 단독 (너무 짧아서 의미없음: 드, 트, 빌, 컴포 등)
    if (/^[가-힣]{1,2}$/.test(opt)) return true
    // 연도로 시작하는 트림 설명 (옵션 필드에 잘못 들어간 트림 정보)
    if (/^20\d\d\s/.test(opt)) return true
    // "선택 시" 포함하는 메모/주석 (옵션명 아님)
    if (opt.includes('선택 시')) return true
    // 순수 숫자만 (데이터 파편)
    if (/^\d+$/.test(opt)) return true
    return false
  }

  // 비교용 키 (공백, 로마숫자, Plus 변형 통일)
  const normalizedKey = (s: string): string => {
    let key = s.replace(/\s+/g, '')
    // ® 제거 (비교 시 무시)
    key = key.replace(/®/g, '')
    // 로마숫자 → 아라비아숫자 통일 (Ⅳ→4, Ⅲ→3, Ⅱ→2, Ⅰ→1)
    key = key.replace(/Ⅳ/g, '4').replace(/Ⅲ/g, '3').replace(/Ⅱ/g, '2').replace(/Ⅰ/g, '1')
    // 라틴 I/II/III (한글 뒤) → 아라비아숫자
    key = key.replace(/(?<=[가-힣])III/g, '3').replace(/(?<=[가-힣])II/g, '2').replace(/(?<=[가-힣])I(?![a-zA-Z])/g, '1')
    // Plus/플러스 → + 통일
    key = key.replace(/Plus$/i, '+').replace(/플러스$/, '+')
    // 연결자 통일: & - → +
    key = key.replace(/&/g, '+')
    key = key.replace(/-/g, '+')
    // 따옴표 변형 통일: " " ″ → "
    key = key.replace(/[\u201C\u201D\u2033]/g, '"')
    return key
  }

  // 테슬라 외장색 한글→영어 매핑
  const TESLA_EXT_COLOR_MAP: Record<string, string> = {
    '화이트': 'Pearl White Multi-Coat',
    '블랙': 'Diamond Black',
    '그레이': 'Stealth Grey',
    '스틸그레이': 'Stealth Grey',
  }
  // 테슬라 내장색 한글→영어 매핑
  const TESLA_INT_COLOR_MAP: Record<string, string> = {
    '블랙': 'All Black',
    '화이트': 'Black & White',
    'Black': 'All Black',
  }

  // 색상 이름 정규화 (마스터데이터 기준 + 금융사 표기 정리)
  const normalizeColorName = (color: string, brand?: string): string => {
    let s = color.trim()
    // 앞의 특수문자 제거 (?오로라블랙펄 → 오로라블랙펄)
    s = s.replace(/^[?？!]/, '')
    // BMW 형식: "#300 - ALPINE WHITE [BMW]" → "ALPINE WHITE"
    s = s.replace(/^#\d+\s*-\s*/, '')
    // 르노 형식: "149-POLAR WHITE" → "POLAR WHITE"
    s = s.replace(/^\d+-/, '')
    // 벤츠 형식: "104 ARTICO TONKA BROWN [BENZ]" → "ARTICO TONKA BROWN"
    s = s.replace(/^\d+\s+(?=[A-Z])/, '')
    // 폴스타/KGM 앞쪽 괄호코드: "(WA2) Aurora White" → "Aurora White"
    s = s.replace(/^\([A-Z0-9]+\)\s*/, '')
    // BMW 내장 코드: "KSJX - VEGANZA BLACK" → "VEGANZA BLACK"
    s = s.replace(/^[A-Z]{2,5}\s*-\s*/, '')
    // 대괄호 주석 제거: [BMW], [BENZ], [ACTIV 기본] 등
    s = s.replace(/\s*\[.*?\]/g, '')
    // (유광) 제거 (기본값이므로 불필요), (무광)은 유지
    s = s.replace(/\s*\(유광\)/g, '')
    // (무광) 이외의 괄호 내용 제거: (SWP), (7인승), (투톤불가) 등
    s = s.replace(/\s*\((?!무광\))[^)]*\)/g, '')
    // 괄호 없는 trailing 색상코드 제거: "펄 W6H" → "펄", "펄 TW3" → "펄"
    s = s.replace(/\s+[A-Z][A-Z0-9]{1,3}$/, '')
    // "인테리어" 접미사 제거
    s = s.replace(/\s*인테리어\s*$/, '')
    // 메리츠캐피탈 등: "외장색/내장색" 합쳐진 데이터 분리 (투톤 제외)
    if (s.includes('/') && !s.includes('투톤')) {
      const slashParts = s.split('/')
      if (slashParts.length === 2) {
        const afterSlash = slashParts[1].trim().replace(/\s/g, '')
        const KNOWN_INTERIOR = ['토프', '코튼베이지', '네이비그레이', '올리브브라운',
          '라이트카키', '피칸브라운', '인디고', '네이비', '브라운', '베이지', '다크그레이']
        if (KNOWN_INTERIOR.some(ic => afterSlash === ic)) {
          s = slashParts[0].trim()
        }
      }
    }
    // 연결자 통일: "/" 와 "+" 를 공백으로 (투톤 색상 표기 통일)
    s = s.replace(/[\/+]/g, ' ')
    // 공백 정규화
    s = s.trim().replace(/\s+/g, ' ')
    // 마스터데이터에서 공식 색상명 조회 (색상코드, 변형 표기 → 공식명)
    s = lookupExtColorForModel(s, modelName)
    // 테슬라: 한글 색상명 → 영어로 정규화
    if (brand === '테슬라' && TESLA_EXT_COLOR_MAP[s]) {
      s = TESLA_EXT_COLOR_MAP[s]
    }
    return s
  }

  // 내장색 이름 정규화 (마스터데이터 기준 - 외장색과 별도 맵 사용)
  const normalizeIntColorName = (color: string, brand?: string): string => {
    let s = color.trim()
    s = s.replace(/^[?？!]/, '')
    s = s.replace(/\s*\[.*?\]/g, '')
    s = s.replace(/\s*인테리어\s*$/, '')

    if (brand === '제네시스') {
      // 제네시스: 가니쉬를 추출하여 정규화 후 색상_가니쉬 형태로 재결합
      let garnish = ''
      s = s.replace(/^스포츠전용_/, '')
      s = s.replace(/\(가니쉬\)\s*/g, '')
      // 표기 오류 통일 (DB 오타/변형)
      s = s.replace(/글레시어/g, '글레이셔').replace(/글래이셔/g, '글레이셔')
      s = s.replace(/하나바/g, '하바나')

      // Phase 1: (XXX시트) 좌석 색상 정보 → 투톤 조합 복원
      const seatMatch = s.match(/\(([^)]*시트)\)(.*)/)
      if (seatMatch) {
        const seatColor = seatMatch[1].replace(/시트$/, '').trim()
        const afterParen = seatMatch[2].trim()
        s = s.substring(0, s.indexOf(seatMatch[0])).trim()
        // 닫는 괄호 뒤 텍스트 → 가니쉬 (예: 올리브애쉬, /바잘트)
        if (afterParen) {
          const afterClean = afterParen.replace(/^[\/+]\s*/, '')
          if (afterClean) {
            const m = lookupGarnishForModel(afterClean, modelName)
            garnish = m || afterClean
          }
        }
        // 모노톤이 아닌 경우 좌석 색상으로 투톤 구성
        if (!s.includes('모노') && !s.includes('투톤') && !s.includes('/')) {
          s = `${s}/${seatColor}`
        }
      } else {
        // Phase 2: 일반 괄호 처리 (비-시트)
        const parenMatch = s.match(/\(([^)]+)\)/)
        s = s.replace(/\s*\(.*?\)/g, '')

        // 1. _가니쉬 접미사 (명시적 구분자)
        const underscoreIdx = s.lastIndexOf('_')
        if (underscoreIdx > 0) {
          const raw = s.substring(underscoreIdx + 1).trim()
          s = s.substring(0, underscoreIdx)
          const m = lookupGarnishForModel(raw, modelName)
          garnish = m || raw
          // _가니쉬 추출 후 남은 색상부에서 /스티치 제거
          if (/[\/+]/.test(s)) {
            const parts = s.split(/[\/+]/).map(p => p.trim()).filter(Boolean)
            if (parts.length >= 2 && parts[parts.length - 1].includes('스티치')) {
              parts.pop()
              s = parts.join('/')
            }
          }
        }
        // 2. / 또는 + 구분자: 마지막 세그먼트가 가니쉬 또는 스티치인지 확인
        else if (/[\/+]/.test(s)) {
          const parts = s.split(/[\/+]/).map(p => p.trim()).filter(Boolean)
          if (parts.length >= 2) {
            const lastPart = parts[parts.length - 1]
            if (lastPart.includes('스티치')) {
              parts.pop()
              s = parts.join('/')
            } else {
              const m = lookupGarnishForModel(lastPart, modelName)
              if (m) {
                garnish = m
                parts.pop()
                s = parts.join('/')
              }
            }
          }
        }
        // 3. 괄호 내용이 가니쉬인지 확인
        if (!garnish && parenMatch) {
          const candidate = parenMatch[1].trim()
          if (!candidate.includes('스티치')) {
            const m = lookupGarnishForModel(candidate, modelName)
            if (m) garnish = m
          }
        }
      }

      s = s.replace(/모노(?!톤)/, '모노톤')
      s = s.trim().replace(/\s+/g, ' ')
      s = lookupIntColorForModel(s, modelName)
      if (garnish) s = `${s}_${garnish}`
      return s
    }

    // 비제네시스
    s = s.replace(/\s*\(.*?\)/g, '')
    s = s.replace(/[\/+]/g, ' ')
    s = s.trim().replace(/\s+/g, ' ')
    // 모델별 내장색 정규화 (원톤→모노톤, 다크차콜→블랙 등 + 글로벌 fallback)
    s = lookupIntColorForModel(s, modelName)
    // 테슬라: 한글 내장색명 → 영어로 정규화
    if (brand === '테슬라' && TESLA_INT_COLOR_MAP[s]) {
      s = TESLA_INT_COLOR_MAP[s]
    }
    return s
  }

  // 라인업 정규화 헬퍼 (modelName + rawVehicleName으로 인승 추출)
  const getNormalizedLineup = (lineup: string | null, rawVehicleName?: string | null): string => {
    if (!lineup) return ''
    return normalizeLineup(lineup, modelName, rawVehicleName || undefined)
  }

  // 고유 값 추출 (필터 옵션용)
  const uniqueValues = useMemo(() => {
    // 현대캐피탈(소호)/현대캐피탈(스타오토모빌) → 현대캐피탈로 통합
    const rawSources = [...new Set(vehicles.map(v => v.source))].filter(Boolean) as string[]
    const sources = [...new Set(rawSources.map(s => s.startsWith('현대캐피탈') ? '현대캐피탈' : s))]
    // 상품구분: 렌트/리스만 표시
    const ALLOWED_PRODUCT_TYPES = new Set(['렌트', '리스'])
    const PRODUCT_TYPE_ORDER: Record<string, number> = { '렌트': 0, '리스': 1 }
    const productTypes = ([...new Set(vehicles.map(v => v.product_type))].filter(Boolean) as string[])
      .filter(t => ALLOWED_PRODUCT_TYPES.has(t))
      .sort((a, b) => (PRODUCT_TYPE_ORDER[a] ?? 99) - (PRODUCT_TYPE_ORDER[b] ?? 99))

    // 라인업 정규화 후 고유 값 추출
    const lineupSet = new Set<string>()
    vehicles.forEach(v => {
      const normalized = getNormalizedLineup(v.lineup, v.raw_vehicle_name)
      if (normalized) lineupSet.add(normalized)
    })
    // 라인업 정렬: 년형 오름차순 (2025→2026), 그 후 배기량/기타 오름차순
    const lineups = [...lineupSet].sort((a, b) => {
      const yearA = a.match(/(\d{4})년형/)?.[1] || '9999'
      const yearB = b.match(/(\d{4})년형/)?.[1] || '9999'
      if (yearA !== yearB) return yearA.localeCompare(yearB)
      return a.localeCompare(b)
    })

    // 트림 정규화: (인승), 구동방식(2WD/4WD/AWD) 제거 (라인업에서 관리)
    const normalizeTrim = (trim: string): string => {
      return trim
        .replace(/\s*\(\d+인승\)\s*$/, '')
        .replace(/\s+(?:2WD|4WD|AWD|RWD)\s*$/, '')
        .trim()
    }

    // 트림 정렬: 저렴한 트림 우선 (마스터 데이터 기준)
    const TRIM_ORDER: Record<string, number> = {
      // 기본/입문
      '기본형': 0, '스탠다드': 0, 'Standard': 0, '베이직': 0, 'Basic': 0,
      // EV 입문
      '라이트': 1, 'Light': 1, 'E-밸류+': 1,
      '에어': 2, 'Air': 2,
      // 국산 입문~중간
      '스마트': 3, 'Smart': 3,
      '트렌디': 4, 'Trendy': 4,
      '모던': 5, 'Modern': 5,
      // 중간
      '프리미엄': 6, 'Premium': 6,
      '어스': 7, 'Earth': 7,
      '익스클루시브': 8, 'Exclusive': 8,
      // 상위
      '프레스티지': 9, 'Prestige': 9,
      '럭셔리': 9, 'Luxury': 9,
      '베스트 셀렉션': 9,
      '스포츠': 10, 'Sports': 10,
      '노블레스 라이트': 10,
      '노블레스': 11, 'Noblesse': 11,
      '스포츠 플러스': 11,
      'H-Pick': 11,
      '인스퍼레이션': 12, 'Inspiration': 12,
      '아너스': 12, 'Honors': 12,
      '퍼포먼스': 12, 'Performance': 12,
      // 최상위
      '시그니처': 13, 'Signature': 13,
      '시그니처 블랙': 14,
      '캘리그래피': 15, 'Calligraphy': 15,
      '그래비티': 15, 'Gravity': 15,
      'E-라이트': 15, 'E-Lite': 15,
      // 스포츠/특별 라인
      'N Line': 16, 'N 라인': 16,
      'GT-Line': 16, 'GT 라인': 16, 'GT-line': 16,
      'X-Line': 16, 'X 라인': 16,
      'N 퍼포먼스': 17,
      // 르노
      'techno': 3, '테크노': 3,
      'iconic': 6, '아이코닉': 6,
      'esprit Alpine': 9, '에스프리 알핀': 9,
      // KGM
      'T5': 3, 'T6': 6, 'T7': 9,
      'LX': 3, 'MX': 6, 'TX': 9,
      'VX': 1,
      '칸': 3, '칸 플러스': 6, '칸 프리미엄': 9,
      // 타스만
      '다이내믹': 3, '어드벤처': 6, '익스트림': 9, 'X-Pro': 12,
    }
    const getTrimOrder = (trim: string): number => {
      // 정확 매칭 우선
      if (TRIM_ORDER[trim] !== undefined) return TRIM_ORDER[trim]
      // 포함 검사 (긴 키 우선: "시그니처 블랙"이 "시그니처"보다 먼저 매칭)
      const sorted = Object.entries(TRIM_ORDER).sort((a, b) => b[0].length - a[0].length)
      for (const [key, order] of sorted) {
        if (trim.includes(key)) return order
      }
      return 50
    }
    const trimMap = new Map<string, string>() // normalizedKey → display name
    vehicles.forEach(v => {
      if (!v.trim) return
      const normalized = normalizeTrim(v.trim)
      if (!normalized) return
      const key = normalizedKey(normalized)
      if (!trimMap.has(key)) trimMap.set(key, normalized)
    })
    const trims = [...trimMap.values()]
      .sort((a, b) => getTrimOrder(a) - getTrimOrder(b) || a.localeCompare(b))

    // 의미없는 색상 값 판별
    const isJunkColor = (name: string): boolean => {
      if (!name) return true
      if (/^\d+$/.test(name)) return true // 순수 숫자 (220000)
      if (name === '내장기본색' || name === '기본색') return true
      if (name.length <= 1) return true
      return false
    }

    // 외장색 정규화 후 고유 값 추출 (옵션 필터링보다 먼저 수집)
    const extColorMap = new Map<string, string>()
    vehicles.forEach(v => {
      if (!v.exterior_color) return
      const name = normalizeColorName(v.exterior_color, v.brand ?? undefined)
      if (isJunkColor(name)) return
      const key = normalizedKey(name)
      if (!extColorMap.has(key)) {
        extColorMap.set(key, name)
      }
    })
    // 외장색 정렬: 흰색 → 검은색 → 회색 → 기타
    const EXT_COLOR_PRIORITY: [string[], number][] = [
      [['화이트', 'white', '흰', '백', '클리어', '크리미'], 0],
      [['블랙', 'black', '검정', '검은'], 1],
      [['그레이', 'grey', 'gray', '회색', '실버', 'silver', '은색'], 2],
    ]
    const getExtColorOrder = (color: string): number => {
      const lc = color.toLowerCase()
      for (const [keywords, order] of EXT_COLOR_PRIORITY) {
        if (keywords.some(kw => lc.includes(kw))) return order
      }
      return 10
    }
    const exteriorColors = [...extColorMap.values()]
      .sort((a, b) => getExtColorOrder(a) - getExtColorOrder(b) || a.localeCompare(b))

    // 외장색 이름 Set (옵션에서 색상 제외용)
    const extColorNames = new Set(extColorMap.values())

    // 옵션을 개별 항목으로 분리 + 정규화하여 고유 값 추출 (색상명 제외)
    const optionsMap = new Map<string, string>() // 공백없는키 → 표시명
    vehicles.forEach(v => {
      splitOptions(v.options).forEach(opt => {
        const name = normalizeOptionName(opt)
        if (!name) return // 정규화 후 빈 문자열 제외
        if (isColorOption(name)) return // 마스터데이터 색상명은 옵션에서 제외
        if (extColorNames.has(name)) return // 외장색상명은 옵션에서 제외
        if (isJunkOption(name)) return // 의미없는 옵션 제외
        const key = normalizedKey(name)
        if (!optionsMap.has(key)) {
          optionsMap.set(key, name)
        } else {
          // 공백이 더 많은 (더 정리된) 표시명 선호
          const existing = optionsMap.get(key)!
          if (name.split(' ').length > existing.split(' ').length) {
            optionsMap.set(key, name)
          }
        }
      })
    })
    const optionsList = [...optionsMap.values()].sort()

    // 내장색 정규화 후 고유 값 추출 (내장색 전용 맵 사용 + 외장색 필터링)
    const intColorMap = new Map<string, string>()
    vehicles.forEach(v => {
      if (!v.interior_color) return
      const name = normalizeIntColorName(v.interior_color, v.brand ?? undefined)
      if (isJunkColor(name)) return
      if (isKnownColorName(name)) return // 외장색이 내장색 필드에 잘못 들어간 경우 제외
      const key = normalizedKey(name)
      if (!intColorMap.has(key)) {
        intColorMap.set(key, name)
      }
    })
    // 내장색 정렬: 검은색 → 갈색 → 회색 → 기타
    const INT_COLOR_PRIORITY: [string[], number][] = [
      [['블랙', 'black', '검정', '차콜'], 0],
      [['브라운', 'brown', '갈색', '캐러멜', '피칸', '베이지', '크림'], 1],
      [['그레이', 'grey', 'gray', '회색'], 2],
    ]
    const getIntColorOrder = (color: string): number => {
      const lc = color.toLowerCase()
      for (const [keywords, order] of INT_COLOR_PRIORITY) {
        if (keywords.some(kw => lc.includes(kw))) return order
      }
      return 10
    }
    const interiorColors = [...intColorMap.values()]
      .sort((a, b) => getIntColorOrder(a) - getIntColorOrder(b) || a.localeCompare(b))

    const saleConditions = ([...new Set(vehicles.map(v => v.sale_condition))].filter(Boolean) as string[]).sort()

    return { sources, productTypes, saleConditions, lineups, trims, optionsList, exteriorColors, interiorColors }
  }, [vehicles])

  // 필터링된 차량
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (filters.source.length > 0) {
        // 현대캐피탈 선택 시 현대캐피탈(소호)/현대캐피탈(스타오토모빌)도 포함
        const sourceMatch = filters.source.some(fs =>
          fs === '현대캐피탈' ? (v.source || '').startsWith('현대캐피탈') : fs === v.source
        )
        if (!sourceMatch) return false
      }
      if (filters.productType.length > 0 && !filters.productType.includes(v.product_type || '')) return false
      if (filters.saleCondition.length > 0 && !filters.saleCondition.includes(v.sale_condition || '')) return false
      if (filters.lineup.length > 0 && !filters.lineup.includes(getNormalizedLineup(v.lineup, v.raw_vehicle_name))) return false
      if (filters.trim.length > 0) {
        const vTrim = v.trim ? v.trim.replace(/\s*\(\d+인승\)\s*$/, '').trim() : ''
        if (!filters.trim.includes(vTrim)) return false
      }
      // 옵션 필터: 선택된 옵션 모두 포함하는 차량만 (AND 조건)
      if (filters.options.length > 0) {
        const vehicleOptKeys = splitOptions(v.options)
          .map(o => normalizedKey(normalizeOptionName(o)))
        for (const filterOpt of filters.options) {
          if (!vehicleOptKeys.includes(normalizedKey(filterOpt))) return false
        }
      }
      // 외장색 필터: 정규화된 키로 비교
      if (filters.exteriorColor.length > 0) {
        const vehicleKey = v.exterior_color ? normalizedKey(normalizeColorName(v.exterior_color, v.brand ?? undefined)) : ''
        const matchesAny = filters.exteriorColor.some(c => normalizedKey(c) === vehicleKey)
        if (!matchesAny) return false
      }
      // 내장색 필터: 정규화된 키로 비교
      if (filters.interiorColor.length > 0) {
        const vehicleKey = v.interior_color ? normalizedKey(normalizeIntColorName(v.interior_color, v.brand ?? undefined)) : ''
        const matchesAny = filters.interiorColor.some(c => normalizedKey(c) === vehicleKey)
        if (!matchesAny) return false
      }
      return true
    })
  }, [vehicles, filters])

  // 동일 차량 그룹화 (금융사, 상품구분, 차량명, 라인업, 트림, 옵션, 외장, 내장, 가격이 동일한 경우)
  const groupedVehicles = useMemo(() => {
    const groups = new Map<string, { vehicle: InstantDeliveryVehicle; count: number; latestDate: string }>()

    filteredVehicles.forEach(v => {
      const key = [
        v.source,
        v.product_type,
        v.sale_condition,
        v.discount,
        v.vehicle_name,
        getNormalizedLineup(v.lineup, v.raw_vehicle_name),
        v.trim,
        v.options,
        v.exterior_color,
        v.interior_color,
        v.price
      ].join('|')

      const existing = groups.get(key)
      if (existing) {
        existing.count += 1
        // 가장 최신 날짜 유지
        if (v.created_at > existing.latestDate) {
          existing.latestDate = v.created_at
        }
      } else {
        groups.set(key, { vehicle: v, count: 1, latestDate: v.created_at })
      }
    })

    // 날짜 최신순 정렬
    return [...groups.values()].sort((a, b) =>
      new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    )
  }, [filteredVehicles])

  // 필터 토글 함수
  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const arr = prev[key]
      const next = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value]
      return { ...prev, [key]: next }
    })
  }

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      source: [],
      productType: [],
      saleCondition: [],
      lineup: [],
      trim: [],
      options: [],
      exteriorColor: [],
      interiorColor: [],
    })
  }

  // 활성 필터 개수
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)

  // 로딩 상태
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{modelName} 차량 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-red-600">
            <p className="text-xl font-semibold mb-2">오류 발생</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {brandInfo.logo && (
            <Image
              src={brandInfo.logo}
              alt={brandInfo.brand}
              width={60}
              height={30}
              className="object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{modelName}</h1>
            <p className="text-gray-600 mt-1">총 {vehicles.length}대 등록</p>
          </div>
        </div>
      </div>

      {/* 데이터 없음 */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg text-gray-500">등록된 {modelName} 차량이 없습니다</p>
        </div>
      ) : (
        <>
          {/* 필터 섹션 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">필터</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  필터 초기화 ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* 금융사 필터 (특판에서만 표시) */}
              {uniqueValues.sources.length > 0 && categoryParam !== 'dealer' && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">금융사</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.sources.map(source => (
                      <button
                        key={source}
                        onClick={() => toggleFilter('source', source)}
                        className={`
                          w-[100px] h-[38px] flex items-center justify-center rounded-lg text-sm font-medium transition-all border
                          ${filters.source.includes(source)
                            ? 'bg-blue-600 border-blue-600 ring-1 ring-blue-600'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                          }
                        `}
                        title={source}
                      >
                        <Image
                          src={getSourceLogoPath(source)}
                          alt={source}
                          width={90}
                          height={28}
                          className="object-contain max-w-[90px] max-h-[28px]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 상품구분 필터 */}
              {uniqueValues.productTypes.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">상품구분</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.productTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter('productType', type)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.productType.includes(type)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 판매조건 필터 (대리점탭에서만) */}
              {uniqueValues.saleConditions.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">판매조건</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.saleConditions.map(condition => (
                      <button
                        key={condition}
                        onClick={() => toggleFilter('saleCondition', condition)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.saleCondition.includes(condition)
                            ? condition === '한정'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 라인업 필터 */}
              {uniqueValues.lineups.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">라인업</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.lineups.map(lineup => (
                      <button
                        key={lineup}
                        onClick={() => toggleFilter('lineup', lineup)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.lineup.includes(lineup)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {lineup}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 트림 필터 */}
              {uniqueValues.trims.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">트림</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.trims.map(trim => (
                      <button
                        key={trim}
                        onClick={() => toggleFilter('trim', trim)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.trim.includes(trim)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {trim}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 옵션 필터 */}
              {uniqueValues.optionsList.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">옵션</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.optionsList.map(option => (
                      <button
                        key={option}
                        onClick={() => toggleFilter('options', option)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.options.includes(option)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 외장색 필터 */}
              {uniqueValues.exteriorColors.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">외장색</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.exteriorColors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter('exteriorColor', color)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.exteriorColor.includes(color)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 내장색 필터 */}
              {uniqueValues.interiorColors.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 pt-1">내장색</span>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.interiorColors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter('interiorColor', color)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${filters.interiorColor.includes(color)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 결과 카운트 */}
          <div className="mb-4 text-sm text-gray-600">
            검색 결과: <span className="font-semibold text-gray-900">{filteredVehicles.length}</span>대
            {groupedVehicles.length !== filteredVehicles.length && (
              <span className="text-gray-400 ml-2">({groupedVehicles.length}개 항목)</span>
            )}
          </div>

          {/* 차량 카드 리스트 */}
          {groupedVehicles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg text-gray-500">조건에 맞는 차량이 없습니다</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {groupedVehicles.map(({ vehicle, count, latestDate }, index) => (
                <div
                  key={`group-${index}`}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-stretch gap-4">
                    {/* 왼쪽: 로고 (특판=금융사, 대리점=브랜드) */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 w-[100px]">
                      {categoryParam === 'dealer' ? (
                        <Image
                          src={brandInfo.logo || getBrandLogoPath(vehicle.brand || '')}
                          alt={brandInfo.brand}
                          width={50}
                          height={25}
                          className="object-contain"
                        />
                      ) : (
                        <>
                          <Image
                            src={getSourceLogoPath(vehicle.source)}
                            alt={vehicle.source || ''}
                            width={90}
                            height={28}
                            className="object-contain max-w-[90px] max-h-[28px]"
                          />
                          {vehicle.source === '현대캐피탈(소호)' && (
                            <span className="text-[10px] text-gray-500 mt-0.5">소호</span>
                          )}
                          {vehicle.source === '현대캐피탈(스타오토모빌)' && (
                            <span className="text-[10px] text-gray-500 mt-0.5">스타오토모빌</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* 중간: 차량 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 1행: 판매조건 | 차량명 라인업 */}
                      <div className="flex items-center gap-2">
                        {vehicle.sale_condition ? (
                          <span className={`
                            inline-flex px-2 py-0.5 rounded text-xs font-medium flex-shrink-0
                            ${vehicle.sale_condition === '한정'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                            }
                          `}>
                            {vehicle.sale_condition}
                          </span>
                        ) : vehicle.product_type ? (
                          <span className={`
                            inline-flex px-2 py-0.5 rounded text-xs font-medium flex-shrink-0
                            ${vehicle.product_type === '렌트'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                            }
                          `}>
                            {vehicle.product_type}
                          </span>
                        ) : null}
                        <span className="font-semibold text-gray-900">
                          {vehicle.vehicle_name}
                          {vehicle.lineup && <span className="text-gray-500 font-normal ml-1">| {getNormalizedLineup(vehicle.lineup, vehicle.raw_vehicle_name)}</span>}
                        </span>
                        {count > 1 && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            {count}대
                          </span>
                        )}
                      </div>

                      {/* 2행: 트림 / 옵션 / 외장 / 내장 */}
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        {vehicle.trim && (
                          <span className="text-gray-700">{vehicle.trim.replace(/\s*\(\d+인승\)\s*$/, '')}</span>
                        )}
                        {vehicle.options && vehicle.options !== '무옵션' && (
                          <>
                            <span className="text-gray-300">/</span>
                            <span>{vehicle.options}</span>
                          </>
                        )}
                        {vehicle.exterior_color && (
                          <>
                            <span className="text-gray-300">/</span>
                            <span>외장: {normalizeColorName(vehicle.exterior_color, vehicle.brand ?? undefined)}</span>
                          </>
                        )}
                        {vehicle.interior_color && (
                          <>
                            <span className="text-gray-300">/</span>
                            <span>내장: {normalizeIntColorName(vehicle.interior_color, vehicle.brand ?? undefined)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 오른쪽: 할인액 (위) + 차량가 (아래) */}
                    <div className="flex flex-col items-end justify-center flex-shrink-0">
                      {vehicle.discount && vehicle.discount > 0 ? (
                        <span className="text-xs font-semibold text-red-500">
                          -{vehicle.discount.toLocaleString()}원
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {new Date(latestDate).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      <span className="font-semibold text-base text-blue-600">
                        {vehicle.price ? `${vehicle.price.toLocaleString()}원` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* 프로모션 (있을 경우만 표시) */}
                  {vehicle.promotion && (
                    <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                      {vehicle.promotion}
                    </div>
                  )}

                  {/* 비고 (있을 경우만 표시) */}
                  {vehicle.note && (
                    <div className="mt-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      {vehicle.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
