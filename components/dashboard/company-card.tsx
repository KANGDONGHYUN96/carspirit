'use client'

interface Company {
  id: string
  company_name: string
  logo_url: string | null
  product_types: string[]
}

interface CompanyCardProps {
  company: Company
  onClick: () => void
}

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
  // SK렌터카는 로고 크기를 70%로 줄임
  const logoSize = company.company_name === 'SK렌터카' ? '70%' : '100%'

  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col items-center"
    >
      {/* 로고 영역 */}
      <div className="w-full h-24 mb-3 flex items-center justify-center bg-white rounded-lg border border-gray-100">
        <img
          src={company.logo_url || '/company-logos/kb.png'}
          alt={company.company_name}
          style={{ maxWidth: logoSize, maxHeight: logoSize, objectFit: 'contain' }}
        />
      </div>

      {/* 업체명 */}
      <h3 className="text-sm font-semibold text-gray-900 text-center line-clamp-2 mb-2">
        {company.company_name}
      </h3>

      {/* 상품구분 태그 */}
      {company.product_types.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center">
          {company.product_types.map((type, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200"
            >
              {type}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
