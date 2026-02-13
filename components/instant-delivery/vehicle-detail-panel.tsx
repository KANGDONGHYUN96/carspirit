'use client'

import { useState, useMemo } from 'react'
import VehicleTable from './vehicle-table'
import type { InstantDeliveryVehicle, ProductType } from '@/types/instant-delivery'

interface VehicleDetailPanelProps {
  modelName: string
  vehicles: InstantDeliveryVehicle[]
  onClose: () => void
}

export default function VehicleDetailPanel({
  modelName,
  vehicles,
  onClose
}: VehicleDetailPanelProps) {
  const [productFilter, setProductFilter] = useState<ProductType>(null)

  // 상품구분별 필터링
  const filteredVehicles = useMemo(() => {
    if (!productFilter) return vehicles
    return vehicles.filter(v => v.product_type === productFilter)
  }, [vehicles, productFilter])

  // 상품구분별 카운트
  const counts = useMemo(() => {
    const rent = vehicles.filter(v => v.product_type === '렌트').length
    const lease = vehicles.filter(v => v.product_type === '리스').length
    const both = vehicles.filter(v => v.product_type === '렌트/리스').length
    return { rent, lease, both, total: vehicles.length }
  }, [vehicles])

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {modelName}
          </h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            총 {vehicles.length}대
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 상품구분 필터 */}
      <div className="flex gap-2 px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => setProductFilter(null)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${productFilter === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          전체 ({counts.total})
        </button>
        {counts.rent > 0 && (
          <button
            onClick={() => setProductFilter('렌트')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${productFilter === '렌트'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
              }
            `}
          >
            렌트 ({counts.rent})
          </button>
        )}
        {counts.lease > 0 && (
          <button
            onClick={() => setProductFilter('리스')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${productFilter === '리스'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }
            `}
          >
            리스 ({counts.lease})
          </button>
        )}
        {counts.both > 0 && (
          <button
            onClick={() => setProductFilter('렌트/리스')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${productFilter === '렌트/리스'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }
            `}
          >
            렌트/리스 ({counts.both})
          </button>
        )}
      </div>

      {/* 차량 테이블 */}
      <div className="max-h-[400px] overflow-y-auto">
        <VehicleTable vehicles={filteredVehicles} />
      </div>
    </div>
  )
}
