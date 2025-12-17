'use client'

import { useEffect, useState } from 'react'

interface CompanyFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

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

interface CompanyDetailModalReadonlyProps {
  company: Company
  onClose: () => void
  isAdmin?: boolean
  onSwitchToEdit?: () => void
}

interface ReadonlyFieldProps {
  label: string
  value: string | null
  isLink?: boolean
}

function ReadonlyField({ label, value, isLink = false }: ReadonlyFieldProps) {
  if (!value) return null

  // 텍스트에서 URL을 클릭 가능한 링크로 변환
  const renderTextWithLinks = (text: string) => {
    if (!isLink) return text

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="flex flex-col sm:flex-row mb-3">
      <label className="text-sm font-semibold text-gray-600 w-full sm:w-48 flex-shrink-0 mb-1 sm:mb-0">
        {label}:
      </label>
      <div className="flex-1 text-sm text-gray-900 whitespace-pre-wrap break-words">
        {renderTextWithLinks(value)}
      </div>
    </div>
  )
}

interface ReadonlySectionProps {
  title: string
  children: React.ReactNode
}

function ReadonlySection({ title, children }: ReadonlySectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

export default function CompanyDetailModalReadonly({
  company,
  onClose,
  isAdmin = false,
  onSwitchToEdit,
}: CompanyDetailModalReadonlyProps) {
  const [files, setFiles] = useState<CompanyFile[]>([])

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

  // 파일 목록 로드
  useEffect(() => {
    fetchFiles()
  }, [company.id])

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/companies/${company.id}/files`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('파일 로드 실패:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    return '📎'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 컨텐츠 - 텍스트 선택/복사 가능 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col select-text"
        style={{ userSelect: 'text' }}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {/* 로고 */}
            {company.logo_url ? (
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-full h-full object-contain"
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 기본 정보 */}
          <ReadonlySection title="기본 정보">
            <ReadonlyField label="링크" value={company.website_link} isLink />
            <ReadonlyField label="ID/PW" value={company.id_pw} />
            <ReadonlyField label="전화번호" value={company.phone} />
            <ReadonlyField label="이메일" value={company.email} />
            <ReadonlyField label="팩스" value={company.fax} />
            <ReadonlyField label="주소" value={company.address} />
            <ReadonlyField label="탁송업체" value={company.delivery_company} />
          </ReadonlySection>

          {/* 심사/펀딩 및 계약 */}
          <ReadonlySection title="심사/펀딩 및 계약">
            <ReadonlyField label="심사/펀딩" value={company.screening_funding} />
            <ReadonlyField label="계약 후 보험조건 변경" value={company.insurance_change_after_contract} />
            <ReadonlyField label="리스 질권설정" value={company.lease_pledge} />
          </ReadonlySection>

          {/* 고객/대상 조건 */}
          <ReadonlySection title="고객/대상 조건">
            <ReadonlyField label="연령제한" value={company.age_limit} />
            <ReadonlyField label="국산차/수입차 취급" value={company.domestic_import_available} />
            <ReadonlyField label="신설법인" value={company.new_corporation} />
            <ReadonlyField label="외국인" value={company.foreigner} />
            <ReadonlyField label="건설업" value={company.construction_industry} />
            <ReadonlyField label="면허보증" value={company.license_guarantee} />
            <ReadonlyField label="취급제한" value={company.handling_restrictions} />
            <ReadonlyField label="직계가족 운전가능 조건" value={company.family_driver_condition} />
          </ReadonlySection>

          {/* 보험 및 운용 */}
          <ReadonlySection title="보험 및 운용">
            <ReadonlyField label="대물한도" value={company.liability_limit} />
            <ReadonlyField label="면책금" value={company.deductible} />
            <ReadonlyField label="수입차 보험연령" value={company.rent_import_insurance_age} />
            <ReadonlyField label="운전자 범위" value={company.driver_range} />
            <ReadonlyField label="차량 전손시" value={company.total_loss} />
            <ReadonlyField label="음주취소 후 재취득 1년미만" value={company.drunk_reacquired_under_1year} />
            <ReadonlyField label="운행거리 초과/유예거리" value={company.mileage_excess} />
            <ReadonlyField label="중도해지위약율" value={company.early_termination_penalty} />
            <ReadonlyField label="연체이자율" value={company.overdue_interest_rate} />
            <ReadonlyField label="승계 수수료" value={company.succession_fee} />
          </ReadonlySection>

          {/* 정산·계좌 */}
          <ReadonlySection title="정산·계좌">
            <ReadonlyField label="보증금/선수금 입금계좌" value={company.deposit_account} />
            <ReadonlyField label="통장 명의변경" value={company.account_name_change} />
          </ReadonlySection>

          {/* 기타 공지 */}
          <ReadonlySection title="기타 공지">
            <ReadonlyField label="기타 공지" value={company.other_notice} />
          </ReadonlySection>

          {/* 파일 목록 */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                📁 업체 파일
              </h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 block truncate"
                        >
                          {file.file_name}
                        </a>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)} · {new Date(file.uploaded_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-2">
            {isAdmin && onSwitchToEdit && (
              <button
                onClick={onSwitchToEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                편집
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
