'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Company {
  id: string
  company_name: string
  logo_url: string | null
  product_types: string[]
}

interface CompanyCardResultProps {
  company: Company
  onCompanyClick?: (companyId: string) => void
}

export default function CompanyCardResult({ company, onCompanyClick }: CompanyCardResultProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = () => {
    if (onCompanyClick) {
      onCompanyClick(company.id)
    }
  }

  return (
    <div
      className="relative group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex items-center gap-3 min-w-[200px]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      {/* 로고 */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {company.logo_url ? (
          <Image
            src={company.logo_url}
            alt={company.company_name}
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
            <span className="text-lg font-bold text-gray-400">
              {company.company_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 업체명 & 태그 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {company.company_name}
        </h4>
        <div className="flex gap-1 mt-1">
          {company.product_types.slice(0, 2).map((type, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* 툴팁 */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
          클릭하여 상세정보 보기
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
