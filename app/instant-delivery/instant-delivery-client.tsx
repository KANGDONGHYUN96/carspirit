'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CategoryTabs from '@/components/instant-delivery/category-tabs'
import BrandFilter from '@/components/instant-delivery/brand-filter'
import VehicleCardGrid from '@/components/instant-delivery/vehicle-card-grid'
import CapitalSlider from '@/components/instant-delivery/capital-slider'
import type {
  VehicleCategory,
  InstantDeliveryVehicle,
  VehicleGroup,
  BrandFilterData
} from '@/types/instant-delivery'
import { parseVehicleName } from '@/lib/utils/vehicle-parser'
import { getVehicleImagePath, getBrandLogoPath, getOfficialModelName } from '@/lib/utils/image-mapper'
import { createClient } from '@/lib/supabase/client'

const BRAND_ORDER = ['현대', '기아', '제네시스', '르노코리아', 'KG모빌리티', '쉐보레', '벤츠', 'BMW', '테슬라', '폴스타', 'BYD']

export default function InstantDeliveryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 쿼리 파라미터에서 초기값 읽기
  const categoryParam = (searchParams.get('category') || 'special') as VehicleCategory
  const brandParam = searchParams.get('brand')

  // 상태 관리
  const [category, setCategory] = useState<VehicleCategory>(categoryParam)
  const [activeBrand, setActiveBrand] = useState<string | null>(brandParam)
  const [vehicles, setVehicles] = useState<InstantDeliveryVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL 업데이트 헬퍼
  const updateURL = useCallback((newCategory: string, newBrand: string | null) => {
    const params = new URLSearchParams()
    if (newCategory !== 'special') params.set('category', newCategory)
    if (newBrand) params.set('brand', newBrand)
    const query = params.toString()
    router.replace(`/instant-delivery/${query ? `?${query}` : ''}`)
  }, [router])

  // Supabase에서 데이터 가져오기 (카테고리별 서버사이드 필터링)
  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // 메인 페이지에서는 그룹핑에 필요한 컬럼만 조회
        let allVehicles: any[] = []
        let from = 0
        const pageSize = 1000

        while (true) {
          let query = supabase
            .from('instant_delivery_vehicles_v2')
            .select('brand, vehicle_name, category')

          // 서버사이드 카테고리 필터링
          if (category === 'special') {
            query = query.or('category.eq.regular,category.eq.special,category.is.null')
          } else {
            query = query.eq('category', category)
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

        console.log(`[${category}] ${allVehicles.length}개 차량 데이터 로드 완료`)
        setVehicles(allVehicles)
      } catch (err) {
        console.error('Error fetching vehicles:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [category])

  // 카테고리 변경 핸들러 (브랜드 필터 리셋 + URL 업데이트)
  const handleCategoryChange = (newCategory: VehicleCategory) => {
    setCategory(newCategory)
    setActiveBrand(null)
    updateURL(newCategory, null)
  }

  // 브랜드 변경 핸들러 (URL 업데이트)
  const handleBrandChange = (brand: string | null) => {
    setActiveBrand(brand)
    updateURL(category, brand)
  }

  // 브랜드별 필터 데이터 생성 (이미 서버에서 카테고리 필터링됨)
  const brandFilters: BrandFilterData[] = useMemo(() => {
    const brandCounts: Record<string, { count: number; logo: string }> = {}

    vehicles.forEach(v => {
      const brand = v.brand || parseVehicleName(v.vehicle_name).brand
      if (!brandCounts[brand]) {
        brandCounts[brand] = {
          count: 0,
          logo: getBrandLogoPath(brand)
        }
      }
      brandCounts[brand].count++
    })

    return Object.entries(brandCounts)
      .map(([brand, data]) => ({
        brand,
        logo: data.logo,
        count: data.count
      }))
      .sort((a, b) => {
        const ai = BRAND_ORDER.indexOf(a.brand)
        const bi = BRAND_ORDER.indexOf(b.brand)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
  }, [vehicles])

  // 브랜드 필터링된 차량
  const filteredVehicles = useMemo(() => {
    if (!activeBrand) return vehicles
    return vehicles.filter(v => {
      const brand = v.brand || parseVehicleName(v.vehicle_name).brand
      return brand === activeBrand
    })
  }, [vehicles, activeBrand])

  // 모델별 그룹핑 (이미지 매핑의 공식 명칭 사용)
  const vehicleGroups: VehicleGroup[] = useMemo(() => {
    const groups: Record<string, VehicleGroup> = {}

    filteredVehicles.forEach(v => {
      const vName = v.vehicle_name || ''
      const parsed = parseVehicleName(vName)
      const brand = v.brand || parsed.brand

      // 이미지 경로와 공식 모델명 가져오기
      const imagePath = vName ? getVehicleImagePath(brand, vName) : null
      // 이미지 매핑에 등록된 공식 명칭 사용 (없으면 원래 이름)
      const officialName = vName ? getOfficialModelName(brand, vName) : null
      const modelName = officialName || vName || parsed.modelName

      // 공식 모델명 기준으로 그룹핑
      const key = `${brand}-${modelName}`

      if (!groups[key]) {
        groups[key] = {
          brand,
          modelName,
          vehicles: [],
          image: imagePath || '',
          brandLogo: getBrandLogoPath(brand)
        }
      }
      groups[key].vehicles.push(v)
    })

    return Object.values(groups).sort((a, b) => {
      const ai = BRAND_ORDER.indexOf(a.brand)
      const bi = BRAND_ORDER.indexOf(b.brand)
      const brandDiff = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      if (brandDiff !== 0) return brandDiff
      return a.modelName.localeCompare(b.modelName, 'ko')
    })
  }, [filteredVehicles])

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">차량 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">오류 발생</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 캐피탈 슬라이더 (특판 탭에서만 표시) */}
      {category === 'special' && <CapitalSlider />}

      {/* 카테고리 탭 */}
      <CategoryTabs
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
      />

      {/* 브랜드 필터 */}
      <BrandFilter
        brands={brandFilters}
        activeBrand={activeBrand}
        onBrandChange={handleBrandChange}
      />

      {/* 데이터 개수 표시 */}
      <div className="mb-4 text-sm text-gray-600">
        총 {vehicles.length.toLocaleString()}대 | {vehicleGroups.length}개 모델
      </div>

      {/* 차량 카드 그리드 */}
      <VehicleCardGrid vehicleGroups={vehicleGroups} category={category} />
    </div>
  )
}
