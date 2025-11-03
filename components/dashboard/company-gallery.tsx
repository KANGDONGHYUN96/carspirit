'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CompanyCard from './company-card'
import CompanyDetailModalEditable from './company-detail-modal-editable'
import CompanyDetailModalReadonly from './company-detail-modal-readonly'

interface Company {
  id: string
  company_name: string
  logo_url: string | null
  product_types: string[]
  website_link: string | null
  kakao_link: string | null
  id_pw: string | null
  email: string | null
  fax: string | null
  address: string | null
  phone: string | null
  delivery_company: string | null
  construction_industry: string | null
  insurance_change_after_contract: string | null
  domestic_import_available: string | null
  other_notice: string | null
  liability_limit: string | null
  rent_import_insurance_age: string | null
  lease_pledge: string | null
  deductible: string | null
  license_guarantee: string | null
  deposit_account: string | null
  succession_fee: string | null
  new_corporation: string | null
  screening_funding: string | null
  age_limit: string | null
  overdue_interest_rate: string | null
  foreigner: string | null
  driver_range: string | null
  mileage_excess: string | null
  drunk_reacquired_under_1year: string | null
  early_termination_penalty: string | null
  family_driver_condition: string | null
  total_loss: string | null
  handling_restrictions: string | null
  account_name_change: string | null
}

interface CompanyGalleryProps {
  companies: Company[]
  isAdmin: boolean
}

export default function CompanyGallery({ companies, isAdmin }: CompanyGalleryProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const router = useRouter()

  const handleUpdate = () => {
    // 데이터 새로고침
    router.refresh()
  }

  return (
    <>
      <section className="mb-12 px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">업체별 특이사항</h2>
          <p className="text-sm text-gray-500">각 금융사별 운용조건 및 특이사항을 확인하세요</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => setSelectedCompany(company)}
            />
          ))}
        </div>

        {companies.length === 0 && (
          <p className="text-gray-500 py-12 text-center">등록된 업체가 없습니다.</p>
        )}
      </section>

      {selectedCompany && (
        isAdmin ? (
          <CompanyDetailModalEditable
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
            onUpdate={handleUpdate}
          />
        ) : (
          <CompanyDetailModalReadonly
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )
      )}
    </>
  )
}
