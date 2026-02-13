'use client'

import Image from 'next/image'
import type { InstantDeliveryVehicle } from '@/types/instant-delivery'
import { getSourceLogoPath } from '@/lib/utils/image-mapper'

interface VehicleTableProps {
  vehicles: InstantDeliveryVehicle[]
}

export default function VehicleTable({ vehicles }: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        표시할 차량이 없습니다
      </div>
    )
  }

  // 가격 포맷: 23910000 -> 23,910,000원
  const formatPrice = (price: number | null | undefined): string => {
    if (!price) return '-'
    return `${price.toLocaleString()}원`
  }

  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          {/* 상단: 금융사 로고 + 상품타입 + 차량명 + 가격 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Image
                src={getSourceLogoPath(vehicle.source)}
                alt={vehicle.source}
                width={50}
                height={20}
                className="object-contain"
              />
              <span className={`
                inline-flex px-2 py-0.5 rounded text-xs font-medium
                ${vehicle.product_type === '렌트'
                  ? 'bg-green-100 text-green-700'
                  : vehicle.product_type === '리스'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }
              `}>
                {vehicle.product_type || '-'}
              </span>
              <span className="font-semibold text-gray-900 text-base">
                {vehicle.vehicle_name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-gray-900">
                {formatPrice(vehicle.price)}
              </span>
            </div>
          </div>

          {/* 중간: 라인업, 트림, 옵션, 외장, 내장 - 전부 표시 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {vehicle.lineup && (
              <span>{vehicle.lineup}</span>
            )}
            {vehicle.trim && (
              <span className="text-gray-400">|</span>
            )}
            {vehicle.trim && (
              <span>{vehicle.trim}</span>
            )}
            {vehicle.options && vehicle.options !== '무옵션' && (
              <>
                <span className="text-gray-400">|</span>
                <span>{vehicle.options}</span>
              </>
            )}
            {vehicle.exterior_color && (
              <>
                <span className="text-gray-400">|</span>
                <span>{vehicle.exterior_color}</span>
              </>
            )}
            {vehicle.interior_color && (
              <>
                <span className="text-gray-400">|</span>
                <span>{vehicle.interior_color}</span>
              </>
            )}
          </div>

          {/* 프로모션 (있을 경우만 표시) */}
          {vehicle.promotion && (
            <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {vehicle.promotion}
            </div>
          )}

          {/* 비고 (있을 경우만 표시) */}
          {vehicle.note && (
            <div className="mt-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              {vehicle.note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
