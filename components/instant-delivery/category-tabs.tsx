'use client'

import type { VehicleCategory } from '@/types/instant-delivery'

interface CategoryTabsProps {
  activeCategory: VehicleCategory
  onCategoryChange: (category: VehicleCategory) => void
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onCategoryChange('special')}
        className={`
          px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
          ${activeCategory === 'special'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        특판
      </button>
      <button
        onClick={() => onCategoryChange('dealer')}
        className={`
          px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
          ${activeCategory === 'dealer'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        대리점
      </button>
    </div>
  )
}
