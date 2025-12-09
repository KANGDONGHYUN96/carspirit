'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inquiry, InquiryStatus } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

interface InquiryDetailModalProps {
  inquiry: Inquiry
  onClose: () => void
  userId: string
  userName: string
  userRole: string
}

interface Memo {
  id: string
  user_name: string
  content: string
  created_at: string
}

export default function InquiryDetailModal({
  inquiry,
  onClose,
  userId,
  userName,
  userRole
}: InquiryDetailModalProps) {
  const [status, setStatus] = useState(inquiry.status)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [memos, setMemos] = useState<Memo[]>([])
  const [newMemo, setNewMemo] = useState('')
  const [isLoadingMemos, setIsLoadingMemos] = useState(true)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [showContractForm, setShowContractForm] = useState(false)
  const [contractFormData, setContractFormData] = useState({
    // 기본정보 (읽기전용)
    media: inquiry.source || '카스피릿',
    contractor: userName,
    inquiry_name: inquiry.customer_name,
    inquiry_phone: inquiry.customer_phone || '',
    // 기본정보 (입력)
    funding_same: true, // 펀딩고객 동일여부
    funding_name: '',
    funding_phone: '',
    birth_date: '',
    special_notes: '', // 대체명의자, 면허보증 등

    // 차량정보
    vehicle_name: '',
    vehicle_options: '',
    vehicle_color: '',
    vehicle_price: '',

    // 계약정보
    sales_type: '', // 신차장기렌트/리스/기타
    contract_period: '', // 12/24/36/48/60
    annual_mileage: '',
    initial_cost_type: '', // 선납금/보증금/없음
    initial_cost_amount: '',
    monthly_payment: '', // 월납입료
    insurance_age: '', // 만21세/만26세/자체가입
    car_tax_included: '', // 포함/미포함
    customer_support: '', // 페이백/대납/용품/없음
    contract_type: '', // 전자약정/대면약정
    contract_route: '', // 특판/대리점
    finance_company: '', // 금융사 (특판시)
    dealer_name: '', // 대리점명 (대리점시)
    manufacturer_dealer: '', // 제조사 딜러 (대리점시)
    contract_date: '', // 계약일자
    execution_date: '', // 실행일자

    // 수수료정보
    ag_commission: '',
    finance_commission: '', // 금융사 수당
    dealer_commission: '',
    other_commission: '', // 기타
    customer_support_amount: '', // 고객 지원금
    total_commission: '', // 자동계산

    // 파일
    customer_documents: '',
  })
  const [isSavingContract, setIsSavingContract] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showValidationModal, setShowValidationModal] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // 메모 불러오기
  useEffect(() => {
    loadMemos()
  }, [inquiry.id])

  const loadMemos = async () => {
    setIsLoadingMemos(true)
    try {
      const { data, error } = await supabase
        .from('inquiry_memos')
        .select('*')
        .eq('inquiry_id', inquiry.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMemos(data || [])
    } catch (error) {
      console.error('메모 로딩 에러:', error)
    } finally {
      setIsLoadingMemos(false)
    }
  }

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!newMemo.trim()) {
      setAlert({ message: '메모 내용을 입력하세요', type: 'warning' })
      return
    }

    try {
      const { error } = await supabase
        .from('inquiry_memos')
        .insert({
          inquiry_id: inquiry.id,
          user_id: userId,
          user_name: userName,
          content: newMemo.trim(),
        })

      if (error) throw error

      setNewMemo('')
      await loadMemos()
      setAlert({ message: '메모가 저장되었습니다', type: 'success' })
    } catch (error) {
      console.error('메모 저장 에러:', error)
      setAlert({ message: '메모 저장 실패: ' + (error as Error).message, type: 'error' })
    }
  }

  // 상태 저장
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiry.id)

      if (error) throw error

      setAlert({ message: '저장되었습니다', type: 'success' })
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      setAlert({ message: '저장 실패: ' + (error as Error).message, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // 잠금 해제 (7일 연장)
  const handleLock = async () => {
    const isAdmin = userRole === 'admin'

    if (!isAdmin) {
      // 일반 사용자: 오늘 잠금 횟수 확인
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayLocks, error: countError } = await supabase
        .from('inquiries')
        .select('id, locked_at')
        .eq('locked_by', userId)
        .gte('locked_at', today.toISOString())
        .not('locked_at', 'is', null)

      if (countError) {
        console.error('잠금 횟수 확인 에러:', countError)
        setAlert({ message: '잠금 횟수 확인 실패', type: 'error' })
        return
      }

      const todayLockCount = todayLocks?.length || 0
      if (todayLockCount >= 2) {
        setAlert({ message: '하루에 최대 2개까지만 잠금할 수 있습니다.', type: 'warning' })
        return
      }
    }

    setConfirm({
      message: '이 문의를 7일 연장하시겠습니까?',
      onConfirm: async () => {
        setConfirm(null)
        setIsLocking(true)
        try {
          const now = new Date()

          // 기존 unlock_at이 있으면 그 시간에 +7일, 없으면 현재 시간 + 7일
          let unlockAt: Date
          if (inquiry.unlock_at) {
            const currentUnlockAt = new Date(inquiry.unlock_at)
            unlockAt = new Date(currentUnlockAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 기존 unlock_at + 7일
          } else {
            unlockAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 현재 시간 + 7일
          }

          // 이미 잠금된 문의인지 확인
          const isAlreadyLocked = inquiry.locked_by === userId && inquiry.locked_at

          const updateData: any = {
            unlock_at: unlockAt.toISOString(),
          }

          // 처음 잠그는 경우에만 locked_at과 locked_by 업데이트
          if (!isAlreadyLocked) {
            updateData.locked_at = now.toISOString()
            updateData.locked_by = userId
          }

          const { error } = await supabase
            .from('inquiries')
            .update(updateData)
            .eq('id', inquiry.id)

          if (error) throw error

          setAlert({ message: '7일 연장되었습니다', type: 'success' })
          router.refresh()
          onClose()
        } catch (error) {
          console.error('Lock error:', error)
          setAlert({ message: '잠금 실패: ' + (error as Error).message, type: 'error' })
          setIsLocking(false)
        }
      }
    })
  }

  // 총 수수료 자동 계산: AG + 금융사 + 대리점 + 기타 - 고객지원금
  const calculateTotalCommission = () => {
    const ag = parseInt(contractFormData.ag_commission) || 0
    const finance = parseInt(contractFormData.finance_commission) || 0
    const dealer = parseInt(contractFormData.dealer_commission) || 0
    const other = parseInt(contractFormData.other_commission) || 0
    const customerSupport = parseInt(contractFormData.customer_support_amount) || 0
    return ag + finance + dealer + other - customerSupport
  }

  // 숫자 포맷팅
  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const strValue = String(value)
    const num = strValue.replace(/[^\d]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  // 숫자 입력 핸들러
  const handleNumberInput = (field: string, value: string) => {
    const num = value.replace(/[^\d]/g, '')
    setContractFormData({ ...contractFormData, [field]: num })
  }

  // 생년월일 자동 포맷팅 핸들러 (19961112 -> 1996-11-12)
  const handleBirthDateInput = (value: string) => {
    // 숫자만 추출
    const numOnly = value.replace(/[^\d]/g, '')

    // 8자리 숫자인 경우 자동 포맷팅
    if (numOnly.length === 8) {
      const year = numOnly.substring(0, 4)
      const month = numOnly.substring(4, 6)
      const day = numOnly.substring(6, 8)
      setContractFormData({ ...contractFormData, birth_date: `${year}-${month}-${day}` })
    } else if (numOnly.length <= 8) {
      setContractFormData({ ...contractFormData, birth_date: numOnly })
    } else {
      // 이미 포맷팅된 값이면 그대로 유지
      setContractFormData({ ...contractFormData, birth_date: value })
    }
  }

  // 계약 폼 유효성 검사 함수
  const validateContractForm = (): string[] => {
    const errors: string[] = []

    // 필수 필드 정의 (특이사항 제외)
    const requiredFields: { field: keyof typeof contractFormData; label: string; condition?: boolean }[] = [
      // 기본정보
      { field: 'birth_date', label: '고객 생년월일' },
      // 펀딩 미동일 시 추가 필수
      { field: 'funding_name', label: '펀딩 고객명', condition: !contractFormData.funding_same },
      { field: 'funding_phone', label: '펀딩 고객 연락처', condition: !contractFormData.funding_same },
      // 차량정보
      { field: 'vehicle_name', label: '차량명' },
      { field: 'vehicle_options', label: '옵션' },
      { field: 'vehicle_color', label: '색상' },
      { field: 'vehicle_price', label: '차량가' },
      // 계약정보
      { field: 'sales_type', label: '판매구분' },
      { field: 'contract_period', label: '계약기간' },
      { field: 'annual_mileage', label: '연간주행거리' },
      { field: 'initial_cost_type', label: '초기비용' },
      { field: 'insurance_age', label: '보험연령' },
      { field: 'car_tax_included', label: '자동차세' },
      { field: 'contract_type', label: '계약유형' },
      { field: 'customer_support', label: '고객지원' },
      { field: 'contract_route', label: '계약경로' },
      // 계약경로에 따른 추가 필드
      { field: 'finance_company', label: '금융사', condition: contractFormData.contract_route === '특판' },
      { field: 'dealer_name', label: '대리점명', condition: contractFormData.contract_route === '대리점' },
      { field: 'manufacturer_dealer', label: '제조사 딜러', condition: contractFormData.contract_route === '대리점' },
      // 초기비용 금액 (선납금/보증금 선택 시)
      { field: 'initial_cost_amount', label: '초기비용 금액', condition: contractFormData.initial_cost_type === '선납금' || contractFormData.initial_cost_type === '보증금' },
      // 수수료정보
      { field: 'ag_commission', label: 'AG 수수료' },
    ]

    for (const { field, label, condition } of requiredFields) {
      // condition이 false인 경우 검사 건너뛰기
      if (condition === false) continue

      const value = contractFormData[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(label)
      }
    }

    return errors
  }

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        throw new Error(errorData.error || '파일 업로드 실패')
      }

      const data = await response.json()
      let existingFiles: string[] = []
      if (contractFormData.customer_documents) {
        try {
          existingFiles = JSON.parse(contractFormData.customer_documents)
          if (!Array.isArray(existingFiles)) {
            existingFiles = [contractFormData.customer_documents]
          }
        } catch {
          existingFiles = [contractFormData.customer_documents]
        }
      }

      const updatedFiles = [...existingFiles, data.url]
      setContractFormData({ ...contractFormData, customer_documents: JSON.stringify(updatedFiles) })
      setAlert({ message: '파일 업로드 완료', type: 'success' })
    } catch (error: any) {
      setAlert({ message: `파일 업로드 실패: ${error.message}`, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  // 파일 삭제
  const handleFileDelete = (fileUrl: string) => {
    try {
      let existingFiles: string[] = []
      if (contractFormData.customer_documents) {
        try {
          existingFiles = JSON.parse(contractFormData.customer_documents)
          if (!Array.isArray(existingFiles)) {
            existingFiles = [contractFormData.customer_documents]
          }
        } catch {
          existingFiles = [contractFormData.customer_documents]
        }
      }

      const updatedFiles = existingFiles.filter(url => url !== fileUrl)
      setContractFormData({ ...contractFormData, customer_documents: updatedFiles.length > 0 ? JSON.stringify(updatedFiles) : '' })
      setAlert({ message: '파일이 삭제되었습니다', type: 'success' })
    } catch (error: any) {
      setAlert({ message: '파일 삭제 실패', type: 'error' })
    }
  }

  // 계약 저장
  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    const errors = validateContractForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }

    setIsSavingContract(true)

    try {
      // DB에 존재하는 컬럼만 전송 (inquiry_name, inquiry_phone 제외)
      // customer_name, phone은 항상 문의자 정보
      // funding_name, funding_phone은 계약자 정보 (문의자와 다를 때)
      const payload = {
        customer_name: contractFormData.inquiry_name,
        phone: contractFormData.inquiry_phone,
        contractor: contractFormData.contractor,
        media: contractFormData.media,
        funding_same: contractFormData.funding_same,
        funding_name: contractFormData.funding_name,
        funding_phone: contractFormData.funding_phone,
        birth_date: contractFormData.birth_date,
        special_notes: contractFormData.special_notes,
        vehicle_name: contractFormData.vehicle_name,
        vehicle_options: contractFormData.vehicle_options,
        vehicle_color: contractFormData.vehicle_color,
        vehicle_price: contractFormData.vehicle_price ? parseInt(contractFormData.vehicle_price) : null,
        sales_type: contractFormData.sales_type,
        contract_period: contractFormData.contract_period,
        annual_mileage: contractFormData.annual_mileage ? parseInt(contractFormData.annual_mileage) : null,
        initial_cost_type: contractFormData.initial_cost_type,
        initial_cost_amount: contractFormData.initial_cost_amount ? parseInt(contractFormData.initial_cost_amount) : null,
        monthly_payment: contractFormData.monthly_payment ? parseInt(contractFormData.monthly_payment) : null,
        insurance_age: contractFormData.insurance_age,
        car_tax_included: contractFormData.car_tax_included,
        customer_support: contractFormData.customer_support,
        contract_type: contractFormData.contract_type,
        contract_route: contractFormData.contract_route,
        finance_company: contractFormData.finance_company,
        dealer_name: contractFormData.dealer_name,
        manufacturer_dealer: contractFormData.manufacturer_dealer,
        contract_date: contractFormData.contract_date || null,
        execution_date: contractFormData.execution_date || null,
        ag_commission: contractFormData.ag_commission ? parseInt(contractFormData.ag_commission) : 0,
        finance_commission: contractFormData.finance_commission ? parseInt(contractFormData.finance_commission) : 0,
        dealer_commission: contractFormData.dealer_commission ? parseInt(contractFormData.dealer_commission) : 0,
        other_commission: contractFormData.other_commission ? parseInt(contractFormData.other_commission) : 0,
        customer_support_amount: contractFormData.customer_support_amount ? parseInt(contractFormData.customer_support_amount) : 0,
        total_commission: calculateTotalCommission(),
        customer_documents: contractFormData.customer_documents,
        inquiry_id: inquiry.id,
        status: 'contract',
      }

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '저장 실패')
      }

      // 문의 상태를 "계약"으로 업데이트
      await supabase
        .from('inquiries')
        .update({ status: '계약', updated_at: new Date().toISOString() })
        .eq('id', inquiry.id)

      setAlert({ message: '계약이 등록되었습니다', type: 'success' })
      router.refresh()
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      setAlert({ message: '계약 등록 실패', type: 'error' })
      console.error(error)
    } finally {
      setIsSavingContract(false)
    }
  }

  // 시간 포맷팅 (년,월,일,시,분,초)
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
  }

  // 계약 폼 표시 중이면 계약 폼 렌더링
  if (showContractForm) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowContractForm(false)}
      >
        <div
          className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white p-5 border-b border-gray-200 z-10">
            <h2 className="text-xl font-bold text-gray-900">계약 등록</h2>
          </div>

          <form onSubmit={handleSaveContract} className="p-6 space-y-6">
            {/* 1. 기본정보 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">기본정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">매체</label>
                  <input
                    type="text"
                    value={contractFormData.media}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">담당자</label>
                  <input
                    type="text"
                    value={contractFormData.contractor}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">문의자</label>
                  <input
                    type="text"
                    value={contractFormData.inquiry_name}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">연락처</label>
                  <input
                    type="text"
                    value={contractFormData.inquiry_phone}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-xs font-medium text-gray-700">펀딩 접수 고객</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setContractFormData({ ...contractFormData, funding_same: true, funding_name: '', funding_phone: '' })}
                      className={`px-3 py-1 text-xs rounded ${contractFormData.funding_same ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                    >
                      동일
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractFormData({ ...contractFormData, funding_same: false })}
                      className={`px-3 py-1 text-xs rounded ${!contractFormData.funding_same ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                    >
                      미동일
                    </button>
                  </div>
                </div>
                {!contractFormData.funding_same && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">펀딩 고객명</label>
                      <input
                        type="text"
                        value={contractFormData.funding_name}
                        onChange={(e) => setContractFormData({ ...contractFormData, funding_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="고객명 입력"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">펀딩 고객 연락처</label>
                      <input
                        type="text"
                        value={contractFormData.funding_phone}
                        onChange={(e) => setContractFormData({ ...contractFormData, funding_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">고객 생년월일</label>
                  <input
                    type="text"
                    value={contractFormData.birth_date}
                    onChange={(e) => handleBirthDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="19961112 또는 1996-11-12"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">특이사항</label>
                  <input
                    type="text"
                    value={contractFormData.special_notes}
                    onChange={(e) => setContractFormData({ ...contractFormData, special_notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="대체명의자, 면허보증 등"
                  />
                </div>
              </div>
            </div>

            {/* 2. 차량정보 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">차량정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">차량명</label>
                  <input
                    type="text"
                    value={contractFormData.vehicle_name}
                    onChange={(e) => setContractFormData({ ...contractFormData, vehicle_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="26MY 카니발 HEV 9인승 프레스티지 2WD"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">옵션</label>
                  <input
                    type="text"
                    value={contractFormData.vehicle_options}
                    onChange={(e) => setContractFormData({ ...contractFormData, vehicle_options: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="컨비니언스, 스타일, 드라이브와이즈"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">색상</label>
                    <input
                      type="text"
                      value={contractFormData.vehicle_color}
                      onChange={(e) => setContractFormData({ ...contractFormData, vehicle_color: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="스노우화이트펄 / 토프"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">차량가</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(contractFormData.vehicle_price)}
                        onChange={(e) => handleNumberInput('vehicle_price', e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="43,000,000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 계약정보 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">계약정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">판매구분</label>
                  <div className="flex gap-2">
                    {['렌트', '리스', '기타'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, sales_type: type })}
                        className={`px-4 py-2 text-xs rounded transition-all ${
                          contractFormData.sales_type === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">계약기간</label>
                    <select
                      value={contractFormData.contract_period}
                      onChange={(e) => setContractFormData({ ...contractFormData, contract_period: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    >
                      <option value="">선택</option>
                      <option value="12">12개월</option>
                      <option value="24">24개월</option>
                      <option value="36">36개월</option>
                      <option value="48">48개월</option>
                      <option value="60">60개월</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">연간주행거리</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(contractFormData.annual_mileage)}
                        onChange={(e) => handleNumberInput('annual_mileage', e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="20,000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Km</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">초기비용</label>
                  <div className="flex gap-2 flex-wrap">
                    {['선납금', '보증금', '없음'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, initial_cost_type: type, initial_cost_amount: type === '없음' ? '' : contractFormData.initial_cost_amount })}
                        className={`px-4 py-2 text-xs rounded transition-all ${
                          contractFormData.initial_cost_type === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                    {(contractFormData.initial_cost_type === '선납금' || contractFormData.initial_cost_type === '보증금') && (
                      <div className="relative flex-1 min-w-[150px]">
                        <input
                          type="text"
                          value={formatNumber(contractFormData.initial_cost_amount)}
                          onChange={(e) => handleNumberInput('initial_cost_amount', e.target.value)}
                          className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          placeholder="금액 입력"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">월납입료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.monthly_payment)}
                      onChange={(e) => handleNumberInput('monthly_payment', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="월납입료 입력"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">보험연령</label>
                  <div className="flex gap-2">
                    {['만21세', '만26세', '자체가입'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, insurance_age: type })}
                        className={`px-4 py-2 text-xs rounded transition-all ${
                          contractFormData.insurance_age === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">자동차세</label>
                    <div className="flex gap-2">
                      {['포함', '미포함'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setContractFormData({ ...contractFormData, car_tax_included: type })}
                          className={`flex-1 px-4 py-2 text-xs rounded transition-all ${
                            contractFormData.car_tax_included === type
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">계약유형</label>
                    <div className="flex gap-2">
                      {['전자약정', '대면약정'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setContractFormData({ ...contractFormData, contract_type: type })}
                          className={`flex-1 px-4 py-2 text-xs rounded transition-all ${
                            contractFormData.contract_type === type
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">고객지원</label>
                  <div className="flex gap-2">
                    {['페이백', '대납', '용품', '없음'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, customer_support: type })}
                        className={`px-4 py-2 text-xs rounded transition-all ${
                          contractFormData.customer_support === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">계약경로</label>
                  <div className="flex gap-2 mb-3">
                    {['특판', '대리점'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, contract_route: type, finance_company: '', dealer_name: '', manufacturer_dealer: '' })}
                        className={`px-4 py-2 text-xs rounded transition-all ${
                          contractFormData.contract_route === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {contractFormData.contract_route === '특판' && (
                    <div>
                      <input
                        type="text"
                        value={contractFormData.finance_company}
                        onChange={(e) => setContractFormData({ ...contractFormData, finance_company: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="금융사 입력"
                      />
                    </div>
                  )}
                  {contractFormData.contract_route === '대리점' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={contractFormData.dealer_name}
                          onChange={(e) => setContractFormData({ ...contractFormData, dealer_name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          placeholder="대리점명 (예: 강남대리점)"
                        />
                        <input
                          type="text"
                          value={contractFormData.manufacturer_dealer}
                          onChange={(e) => setContractFormData({ ...contractFormData, manufacturer_dealer: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          placeholder="제조사 딜러 (홍길동/010-0000-0000)"
                        />
                      </div>
                      <input
                        type="text"
                        value={contractFormData.finance_company}
                        onChange={(e) => setContractFormData({ ...contractFormData, finance_company: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="금융사 입력"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">계약일자</label>
                    <input
                      type="date"
                      value={contractFormData.contract_date}
                      onChange={(e) => setContractFormData({ ...contractFormData, contract_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">실행일자</label>
                    <input
                      type="date"
                      value={contractFormData.execution_date}
                      onChange={(e) => setContractFormData({ ...contractFormData, execution_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 수수료 정보 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">수수료 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">AG 수수료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.ag_commission)}
                      onChange={(e) => handleNumberInput('ag_commission', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">금융사 수당</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.finance_commission)}
                      onChange={(e) => handleNumberInput('finance_commission', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">대리점 수당</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.dealer_commission)}
                      onChange={(e) => handleNumberInput('dealer_commission', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">기타</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.other_commission)}
                      onChange={(e) => handleNumberInput('other_commission', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">고객 지원금</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.customer_support_amount)}
                      onChange={(e) => handleNumberInput('customer_support_amount', e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">총 수수료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(String(calculateTotalCommission()))}
                      readOnly
                      className="w-full px-3 py-2 pr-10 bg-gray-100 border border-gray-200 rounded text-sm font-semibold text-gray-700"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">※ 총 수수료 = AG + 금융사 + 대리점 + 기타 - 고객지원금</p>
            </div>

            {/* 고객서류 업로드 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">고객서류</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="contract-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="contract-file-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">클릭하여 파일 업로드</p>
                  <p className="text-xs text-gray-400 mt-1">최종견적서 + 펀딩서류 PDF 합쳐서 올려주세요</p>
                </label>
                {isUploading && <p className="text-sm text-blue-500 mt-2">업로드 중...</p>}
              </div>
              {contractFormData.customer_documents && (
                <div className="mt-3 space-y-2">
                  {(() => {
                    try {
                      const files = JSON.parse(contractFormData.customer_documents)
                      if (Array.isArray(files)) {
                        return files.map((url: string, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                              첨부파일 {idx + 1}
                            </a>
                            <button type="button" onClick={() => handleFileDelete(url)} className="text-red-500 text-xs ml-2">삭제</button>
                          </div>
                        ))
                      }
                    } catch {
                      return null
                    }
                    return null
                  })()}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowContractForm(false)}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSavingContract}
                className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingContract ? '저장 중...' : '계약 등록'}
              </button>
            </div>
          </form>
        </div>

        {/* Custom Alert Modal */}
        <CustomAlert
          isOpen={alert !== null}
          message={alert?.message || ''}
          type={alert?.type}
          onClose={() => setAlert(null)}
        />
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-8 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">문의 상세</h2>
              <p className="text-sm text-gray-400 mt-1 font-light">
                {new Date(inquiry.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-8 py-6 space-y-6">
          {/* 상단 액션 버튼 */}
          <div className="flex items-center justify-between">
            {/* 상태 선택 - 작은 버튼 일렬 */}
            <div className="flex items-center gap-1.5">
              {[
                { name: '신규', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-100' },
                { name: '관리', color: 'bg-green-500', hoverColor: 'hover:bg-green-100' },
                { name: '부재', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-100' },
                { name: '심사', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-100' },
                { name: '가망', color: 'bg-cyan-500', hoverColor: 'hover:bg-cyan-100' },
                { name: '계약', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-100' },
              ].map((s) => (
                <button
                  key={s.name}
                  onClick={() => setStatus(s.name as InquiryStatus)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    status === s.name
                      ? `${s.color} text-white`
                      : `bg-gray-100 text-gray-600 ${s.hoverColor}`
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            {/* 계약/잠금 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContractForm(true)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
              >
                계약
              </button>
              <button
                onClick={handleLock}
                disabled={isLocking}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-md transition-all"
              >
                {isLocking ? '처리중' : '잠금'}
              </button>
            </div>
          </div>

          {/* 고객 정보 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">고객 정보</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">매체</span>
                <span className="text-sm font-medium text-gray-900">{userRole === 'admin' ? (inquiry.source || '카스피릿') : '카스피릿'}</span>
              </div>
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">고객명</span>
                <span className="text-sm font-semibold text-gray-900">{inquiry.customer_name}</span>
              </div>
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">연락처</span>
                <span className="text-sm font-medium text-gray-900">{inquiry.customer_phone || '-'}</span>
              </div>
            </div>
          </section>

          {/* 문의 내용 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">문의 내용</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{inquiry.content}</p>
            </div>
          </section>

          {/* 메모 목록 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">상담 메모</h3>
            <div className="bg-gray-50 rounded-xl p-5 max-h-60 overflow-y-auto space-y-3">
              {isLoadingMemos ? (
                <p className="text-sm text-gray-400 text-center py-6">메모 로딩 중...</p>
              ) : memos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">작성된 메모가 없습니다</p>
              ) : (
                memos.map((memo) => (
                  <div key={memo.id} className="bg-white rounded-lg px-4 py-2.5 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-800 flex-1">{memo.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                      <span className="font-medium text-blue-500">{memo.user_name}</span>
                      <span className="text-gray-300">•</span>
                      <span>{formatDateTime(memo.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 메모 작성 */}
            <div className="mt-4">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="새 메모를 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm placeholder:text-gray-400"
              />
              <button
                onClick={handleSaveMemo}
                className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                메모 추가
              </button>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-8 py-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg transition-all"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-all"
            >
              닫기
            </button>
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
        type="warning"
      />

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">필수 항목 누락</h3>
                <p className="text-sm text-gray-500">아래 항목을 입력해주세요</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-5 max-h-60 overflow-y-auto">
              <ul className="space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-sm text-red-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowValidationModal(false)}
              className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
