'use client'

import Image from 'next/image'
import type { BrandFilterData } from '@/types/instant-delivery'

interface BrandFilterProps {
  brands: BrandFilterData[]
  activeBrand: string | null
  onBrandChange: (brand: string | null) => void
}

export default function BrandFilter({
  brands,
  activeBrand,
  onBrandChange
}: BrandFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* 전체 버튼 */}
      <button
        onClick={() => onBrandChange(null)}
        className={`
          h-8 px-3 rounded border text-sm font-medium transition-all
          ${activeBrand === null
            ? 'bg-orange-50 text-orange-600 border-orange-400'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }
        `}
      >
        전체
      </button>

      {/* 브랜드별 버튼 */}
      {brands.map((brand) => (
        <button
          key={brand.brand}
          onClick={() => onBrandChange(brand.brand)}
          className={`
            h-8 px-3 rounded border text-sm font-medium transition-all inline-flex items-center gap-1.5
            ${activeBrand === brand.brand
              ? 'bg-orange-50 text-orange-600 border-orange-400'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }
          `}
        >
          {brand.logo && (
            <Image
              src={brand.logo}
              alt={brand.brand}
              width={32}
              height={24}
              className="object-contain max-h-6"
            />
          )}
          {brand.brand}
        </button>
      ))}
    </div>
  )
}
