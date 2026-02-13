'use client'

import VehicleCard from './vehicle-card'
import type { VehicleGroup } from '@/types/instant-delivery'

interface VehicleCardGridProps {
  vehicleGroups: VehicleGroup[]
  category?: string
}

export default function VehicleCardGrid({ vehicleGroups, category }: VehicleCardGridProps) {
  if (vehicleGroups.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 text-lg">등록된 차량이 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-4">
      {vehicleGroups.map((group) => (
        <VehicleCard
          key={`${group.brand}-${group.modelName}`}
          brand={group.brand}
          brandLogo={group.brandLogo}
          modelName={group.modelName}
          vehicleImage={group.image}
          totalCount={group.vehicles.length}
          category={category}
        />
      ))}
    </div>
  )
}
