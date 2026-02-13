'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface VehicleCardProps {
  brand: string
  brandLogo: string
  modelName: string
  vehicleImage: string | null
  totalCount: number
  category?: string
}

// 100% 전기차 브랜드
const EV_ONLY_BRANDS = ['테슬라', '폴스타', 'BYD']

// 전용 EV 모델 키워드 (모델명에 포함)
const EV_ONLY_KEYWORDS = [
  'GV60', 'PV5',                                          // 전용 EV 모델
  '폴스타', 'Polestar', 'BYD',                            // 전용 EV 브랜드
  'Model 3', 'Model Y', 'Model S', 'Model X',             // 테슬라 (영문)
  '모델3', '모델Y', '모델S', '모델X', '모델 3', '모델 Y', // 테슬라 (한글)
  '아이오닉',                                              // 현대 아이오닉 시리즈
]

// 파워트레인 타입 감지
function getPowertrainType(name: string, brand?: string): 'hev' | 'ev' | 'fcev' | null {
  // 100% EV 브랜드 (테슬라, 폴스타, BYD)
  if (brand && EV_ONLY_BRANDS.includes(brand)) return 'ev'
  // FCEV (수소차)
  if (name.includes('넥쏘') || name.includes('NEXO') || name.includes('수소') || name.includes('FCEV')) return 'fcev'
  // HEV (하이브리드) - E-TECH = 르노 하이브리드
  if (name.includes('HEV') || name.includes('하이브리드') || /E-TECH/i.test(name)) return 'hev'
  // EV (전기차)
  if (EV_ONLY_KEYWORDS.some(kw => name.includes(kw))) return 'ev'
  if (
    /EV\d/.test(name) ||
    /\bEV\b/.test(name) ||
    name.includes('일렉트릭') ||
    /Electric/i.test(name) ||
    name.includes('전동화') ||
    name.includes('전기')
  ) return 'ev'
  return null
}

export default function VehicleCard({
  brand,
  brandLogo,
  modelName,
  vehicleImage,
  totalCount,
  category
}: VehicleCardProps) {
  const router = useRouter()
  const powertrain = getPowertrainType(modelName, brand)

  const handleClick = () => {
    const params = category ? `?category=${category}` : ''
    router.push(`/instant-delivery/${encodeURIComponent(modelName)}${params}`)
  }

  return (
    <div
      onClick={handleClick}
      className="relative w-[230px] h-[130px] rounded-xl cursor-pointer transition-all duration-200 overflow-hidden bg-white hover:shadow-lg hover:scale-[1.02] border border-gray-100"
    >
      {/* 브랜드 로고 (좌측 상단) */}
      <div className="absolute top-2 left-2 z-10">
        <Image
          src={brandLogo}
          alt={brand}
          width={40}
          height={20}
          className="object-contain"
        />
      </div>

      {/* HEV/EV 배지 (우측 상단) */}
      {powertrain === 'hev' && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
          <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <span className="text-[10px] font-bold text-emerald-700">HEV</span>
        </div>
      )}
      {powertrain === 'ev' && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200">
          <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
          </svg>
          <span className="text-[10px] font-bold text-sky-700">EV</span>
        </div>
      )}
      {powertrain === 'fcev' && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200">
          <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-1v-4H9l3-6v4h1l-2 6z"/>
          </svg>
          <span className="text-[10px] font-bold text-violet-700">FCEV</span>
        </div>
      )}

      {/* 차량 이미지 (중앙) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {vehicleImage ? (
          <Image
            src={vehicleImage}
            alt={modelName}
            width={180}
            height={80}
            className="object-contain"
          />
        ) : (
          <div className="w-[180px] h-[80px] bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">이미지 없음</span>
          </div>
        )}
      </div>

      {/* 차량명 + 대수 (하단) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-sm truncate max-w-[150px]">
            {modelName}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">
            {totalCount}대
          </span>
        </div>
      </div>
    </div>
  )
}
