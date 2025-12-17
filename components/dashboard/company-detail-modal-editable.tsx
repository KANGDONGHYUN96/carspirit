'use client'

import { useEffect, useState } from 'react'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

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

interface CompanyDetailModalEditableProps {
  company: Company
  onClose: () => void
  onUpdate: () => void
}

interface EditableFieldProps {
  label: string
  value: string | null
  onChange: (value: string) => void
  multiline?: boolean
  isLink?: boolean
}

function EditableField({ label, value, onChange, multiline = false, isLink = false }: EditableFieldProps) {
  // 텍스트에서 URL들을 추출
  const extractUrls = (text: string | null): string[] => {
    if (!text) return []
    const urlRegex = /https?:\/\/[^\s]+/g
    return text.match(urlRegex) || []
  }

  const urls = isLink ? extractUrls(value) : []

  return (
    <div className="flex flex-col sm:flex-row mb-3">
      <label className="text-sm font-semibold text-gray-600 w-full sm:w-48 flex-shrink-0 mb-1 sm:mb-0">
        {label}:
      </label>
      <div className="flex-1">
        {multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] select-text"
            placeholder="내용을 입력하세요..."
            style={{ userSelect: 'text' }}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent select-text"
            placeholder="내용을 입력하세요..."
            style={{ userSelect: 'text' }}
          />
        )}
        {isLink && urls.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {urls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer select-text inline-block"
                onClick={(e) => e.stopPropagation()}
                onCopy={(e) => e.stopPropagation()}
                style={{ userSelect: 'text' }}
              >
                🔗 링크 {urls.length > 1 ? index + 1 : '열기'}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface EditableSectionProps {
  title: string
  children: React.ReactNode
}

function EditableSection({ title, children }: EditableSectionProps) {
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

export default function CompanyDetailModalEditable({
  company: initialCompany,
  onClose,
  onUpdate,
}: CompanyDetailModalEditableProps) {
  const [company, setCompany] = useState(initialCompany)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [files, setFiles] = useState<CompanyFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

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

  const updateField = (field: keyof Company, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })

      if (!response.ok) {
        throw new Error('저장 실패')
      }

      setSaveMessage('✅ 저장되었습니다!')
      setTimeout(() => {
        setSaveMessage('')
        onUpdate()
      }, 2000)
    } catch (error) {
      setSaveMessage('❌ 저장 실패')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadMessage('')

    try {
      const formData = new FormData()
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i])
      }

      const response = await fetch(`/api/companies/${company.id}/files`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      setUploadMessage('✅ 업로드 완료!')
      setTimeout(() => setUploadMessage(''), 2000)
      fetchFiles()
      e.target.value = ''
    } catch (error) {
      setUploadMessage('❌ 업로드 실패')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    setConfirm({
      message: '이 파일을 삭제하시겠습니까?',
      onConfirm: async () => {
        setConfirm(null)
        try {
          const response = await fetch(`/api/companies/${company.id}/files/${fileId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('삭제 실패')
          }

          fetchFiles()
        } catch (error) {
          setAlert({ message: '파일 삭제 실패', type: 'error' })
          console.error(error)
        }
      }
    })
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

      {/* 모달 컨텐츠 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
          <EditableSection title="기본 정보">
            <EditableField
              label="링크"
              value={company.website_link}
              onChange={(v) => updateField('website_link', v)}
              isLink
              multiline
            />
            <EditableField
              label="ID/PW"
              value={company.id_pw}
              onChange={(v) => updateField('id_pw', v)}
              multiline
            />
            <EditableField
              label="전화번호"
              value={company.phone}
              onChange={(v) => updateField('phone', v)}
              multiline
            />
            <EditableField
              label="이메일"
              value={company.email}
              onChange={(v) => updateField('email', v)}
              multiline
            />
            <EditableField
              label="팩스"
              value={company.fax}
              onChange={(v) => updateField('fax', v)}
              multiline
            />
            <EditableField
              label="주소"
              value={company.address}
              onChange={(v) => updateField('address', v)}
              multiline
            />
            <EditableField
              label="탁송업체"
              value={company.delivery_company}
              onChange={(v) => updateField('delivery_company', v)}
              multiline
            />
          </EditableSection>

          {/* 심사/펀딩 및 계약 */}
          <EditableSection title="심사/펀딩 및 계약">
            <EditableField
              label="심사/펀딩"
              value={company.screening_funding}
              onChange={(v) => updateField('screening_funding', v)}
              multiline
            />
            <EditableField
              label="계약 후 보험조건 변경"
              value={company.insurance_change_after_contract}
              onChange={(v) => updateField('insurance_change_after_contract', v)}
              multiline
            />
            <EditableField
              label="리스 질권설정"
              value={company.lease_pledge}
              onChange={(v) => updateField('lease_pledge', v)}
              multiline
            />
          </EditableSection>

          {/* 고객/대상 조건 */}
          <EditableSection title="고객/대상 조건">
            <EditableField
              label="연령제한"
              value={company.age_limit}
              onChange={(v) => updateField('age_limit', v)}
              multiline
            />
            <EditableField
              label="국산차/수입차 취급"
              value={company.domestic_import_available}
              onChange={(v) => updateField('domestic_import_available', v)}
              multiline
            />
            <EditableField
              label="신설법인"
              value={company.new_corporation}
              onChange={(v) => updateField('new_corporation', v)}
              multiline
            />
            <EditableField
              label="외국인"
              value={company.foreigner}
              onChange={(v) => updateField('foreigner', v)}
              multiline
            />
            <EditableField
              label="건설업"
              value={company.construction_industry}
              onChange={(v) => updateField('construction_industry', v)}
              multiline
            />
            <EditableField
              label="면허보증"
              value={company.license_guarantee}
              onChange={(v) => updateField('license_guarantee', v)}
              multiline
            />
            <EditableField
              label="취급제한"
              value={company.handling_restrictions}
              onChange={(v) => updateField('handling_restrictions', v)}
              multiline
            />
            <EditableField
              label="직계가족 운전가능 조건"
              value={company.family_driver_condition}
              onChange={(v) => updateField('family_driver_condition', v)}
              multiline
            />
          </EditableSection>

          {/* 보험 및 운용 */}
          <EditableSection title="보험 및 운용">
            <EditableField
              label="대물한도"
              value={company.liability_limit}
              onChange={(v) => updateField('liability_limit', v)}
              multiline
            />
            <EditableField
              label="면책금"
              value={company.deductible}
              onChange={(v) => updateField('deductible', v)}
              multiline
            />
            <EditableField
              label="수입차 보험연령"
              value={company.rent_import_insurance_age}
              onChange={(v) => updateField('rent_import_insurance_age', v)}
              multiline
            />
            <EditableField
              label="운전자 범위"
              value={company.driver_range}
              onChange={(v) => updateField('driver_range', v)}
              multiline
            />
            <EditableField
              label="차량 전손시"
              value={company.total_loss}
              onChange={(v) => updateField('total_loss', v)}
              multiline
            />
            <EditableField
              label="음주취소 후 재취득 1년미만"
              value={company.drunk_reacquired_under_1year}
              onChange={(v) => updateField('drunk_reacquired_under_1year', v)}
              multiline
            />
            <EditableField
              label="운행거리 초과/유예거리"
              value={company.mileage_excess}
              onChange={(v) => updateField('mileage_excess', v)}
              multiline
            />
            <EditableField
              label="중도해지위약율"
              value={company.early_termination_penalty}
              onChange={(v) => updateField('early_termination_penalty', v)}
              multiline
            />
            <EditableField
              label="연체이자율"
              value={company.overdue_interest_rate}
              onChange={(v) => updateField('overdue_interest_rate', v)}
              multiline
            />
            <EditableField
              label="승계 수수료"
              value={company.succession_fee}
              onChange={(v) => updateField('succession_fee', v)}
              multiline
            />
          </EditableSection>

          {/* 정산·계좌 */}
          <EditableSection title="정산·계좌">
            <EditableField
              label="보증금/선수금 입금계좌"
              value={company.deposit_account}
              onChange={(v) => updateField('deposit_account', v)}
              multiline
            />
            <EditableField
              label="통장 명의변경"
              value={company.account_name_change}
              onChange={(v) => updateField('account_name_change', v)}
              multiline
            />
          </EditableSection>

          {/* 기타 공지 */}
          <EditableSection title="기타 공지">
            <EditableField
              label="기타 공지"
              value={company.other_notice}
              onChange={(v) => updateField('other_notice', v)}
              multiline
            />
          </EditableSection>

          {/* 파일 관리 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              📁 업체 파일 관리
            </h3>

            {/* 파일 업로드 */}
            <div className="mb-4">
              <label className="block mb-2">
                <div className="px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-center">
                  <span className="text-blue-600 font-medium">
                    {isUploading ? '업로드 중...' : '📎 파일 선택 (PDF, 이미지, 엑셀 등)'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              </label>
              {uploadMessage && (
                <div className="text-sm font-medium mt-2">{uploadMessage}</div>
              )}
            </div>

            {/* 파일 목록 */}
            {files.length > 0 ? (
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
                    <button
                      onClick={() => handleFileDelete(file.id)}
                      className="ml-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                업로드된 파일이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {saveMessage && (
              <div className="text-sm font-medium">{saveMessage}</div>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alert Modal */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />

      {/* Custom Confirm Modal */}
      <CustomConfirm
        isOpen={confirm !== null}
        message={confirm?.message || ''}
        onConfirm={() => {
          if (confirm?.onConfirm) {
            confirm.onConfirm()
          }
        }}
        onCancel={() => setConfirm(null)}
        type="danger"
      />
    </div>
  )
}
