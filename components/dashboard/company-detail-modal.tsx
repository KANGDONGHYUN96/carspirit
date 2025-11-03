'use client'

import { useEffect } from 'react'
import Image from 'next/image'

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

interface CompanyDetailModalProps {
  company: Company
  onClose: () => void
}

interface DetailSectionProps {
  title: string
  items: { label: string; value: string | null }[]
}

function DetailSection({ title, items }: DetailSectionProps) {
  const visibleItems = items.filter((item) => item.value)

  if (visibleItems.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h3>
      <div className="space-y-2">
        {visibleItems.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row">
            <span className="text-sm font-semibold text-gray-600 w-full sm:w-48 flex-shrink-0">
              {item.label}:
            </span>
            <span className="text-sm text-gray-900 whitespace-pre-line">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CompanyDetailModal({
  company,
  onClose,
}: CompanyDetailModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      {/* 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 로고 */}
            {company.logo_url ? (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={company.logo_url}
                  alt={company.company_name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-gray-400">
                  {company.company_name.charAt(0)}
                </span>
              </div>
            )}

            {/* 업체명 & 태그 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {company.company_name}
              </h2>
              <div className="flex gap-2 mt-1">
                {company.product_types.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-6">
          {/* 개요 */}
          <DetailSection
            title="개요"
            items={[
              { label: '링크', value: company.website_link },
              { label: '카카오톡', value: company.kakao_link },
              { label: 'ID/PW', value: company.id_pw },
            ]}
          />

          {/* 연락처 */}
          <DetailSection
            title="연락처"
            items={[
              { label: '전화번호', value: company.phone },
              { label: '이메일', value: company.email },
              { label: '팩스', value: company.fax },
              { label: '주소', value: company.address },
            ]}
          />

          {/* 보험 및 운용 */}
          <DetailSection
            title="보험 및 운용"
            items={[
              { label: '대물한도', value: company.liability_limit },
              { label: '면책금', value: company.deductible },
              { label: '렌트 수입차 보험연령', value: company.rent_import_insurance_age },
              { label: '연령제한', value: company.age_limit },
              { label: '운전자 범위', value: company.driver_range },
              { label: '운행거리 초과/유예거리', value: company.mileage_excess },
              { label: '차량 전손시', value: company.total_loss },
              {
                label: '음주취소 후 재취득 1년미만',
                value: company.drunk_reacquired_under_1year,
              },
            ]}
          />

          {/* 심사/펀딩 및 계약 */}
          <DetailSection
            title="심사/펀딩 및 계약"
            items={[
              { label: '심사/펀딩', value: company.screening_funding },
              {
                label: '계약 후 보험조건 변경',
                value: company.insurance_change_after_contract,
              },
              { label: '중도해지위약율', value: company.early_termination_penalty },
              { label: '승계 수수료', value: company.succession_fee },
              { label: '리스 질권설정', value: company.lease_pledge },
            ]}
          />

          {/* 고객/대상 조건 */}
          <DetailSection
            title="고객/대상 조건"
            items={[
              { label: '국산차/수입차 취급', value: company.domestic_import_available },
              { label: '신설법인', value: company.new_corporation },
              { label: '외국인', value: company.foreigner },
              { label: '직계가족 운전가능 조건', value: company.family_driver_condition },
              { label: '면허보증', value: company.license_guarantee },
              { label: '취급제한', value: company.handling_restrictions },
              { label: '건설업', value: company.construction_industry },
            ]}
          />

          {/* 정산·계좌 */}
          <DetailSection
            title="정산·계좌"
            items={[
              { label: '보증금/선수금 입금계좌', value: company.deposit_account },
              { label: '통장 명의변경', value: company.account_name_change },
              { label: '연체이자율', value: company.overdue_interest_rate },
            ]}
          />

          {/* 탁송/등록 */}
          <DetailSection
            title="탁송/등록"
            items={[{ label: '탁송업체', value: company.delivery_company }]}
          />

          {/* 기타 */}
          <DetailSection
            title="기타"
            items={[{ label: '기타 공지', value: company.other_notice }]}
          />
        </div>
      </div>
    </div>
  )
}
