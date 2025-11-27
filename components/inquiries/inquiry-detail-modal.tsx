'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inquiry } from '@/types/database.types'
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
    // 기본정보
    contractor: userName, // 담당 영업자
    customer_name: inquiry.customer_name, // 고객명
    media: inquiry.source || '카스피릿', // 매체
    phone: inquiry.customer_phone || '', // 연락처
    birth_date: '', // 생년월일
    special_notes: '', // 특이사항

    // 계약정보
    sales_type: '', // 판매구분: 렌트/리스/일시불/할부
    manufacturer: '', // 제조사
    registration_type: '', // 등록유형: 법인/개인
    contract_route: '', // 계약경로
    vehicle_name: '', // 차량명
    vehicle_price: '', // 차량가
    contract_period: '', // 계약기간 (개월)
    initial_cost_type: '', // 초기비용: 선납금/보증금/없음
    initial_cost_amount: '', // 초기비용 금액
    monthly_payment: '', // 월 납입료
    collateral: '', // 대물
    actual_driver: '', // 실운전자
    annual_mileage: '', // 연간주행거리
    contract_date: '', // 계약일
    delivery_date: '', // 출고일
    contract_memo: '', // 계약 메모

    // 출고정보
    delivery_type: '', // 출고유형: 대리점/특판/발주
    delivery_status: '', // 출고상태: 계약/출고/정산대기/완료
    dealer_name: '', // 대리점명
    dealer_contact: '', // 대리점 딜러 연락처
    delivery_memo: '', // 출고 메모

    // 수수료정보
    total_commission: '', // 총 수수료
    ag_commission: '', // AG 수수료
    customer_commission: '', // 고객 지원금
    capital_commission: '', // 캐피탈 수당
    dealer_commission: '', // 대리점 수당
    payback: '', // 페이백
    settlement_amount: '', // 정산금액

    customer_documents: '',
  })
  const [isSavingContract, setIsSavingContract] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  // 총 수수료 자동 계산
  const calculateTotalCommission = () => {
    const ag = parseInt(contractFormData.ag_commission) || 0
    const capital = parseInt(contractFormData.capital_commission) || 0
    const dealer = parseInt(contractFormData.dealer_commission) || 0
    const payback = parseInt(contractFormData.payback) || 0
    return ag + capital + dealer - payback
  }

  // 숫자 포맷팅
  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  // 숫자 입력 핸들러
  const handleNumberInput = (field: string, value: string) => {
    const num = value.replace(/[^\d]/g, '')
    setContractFormData({ ...contractFormData, [field]: num })
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
    setIsSavingContract(true)

    try {
      const payload = {
        ...contractFormData,
        vehicle_price: contractFormData.vehicle_price ? parseInt(contractFormData.vehicle_price) : null,
        ag_commission: contractFormData.ag_commission ? parseInt(contractFormData.ag_commission) : 0,
        capital_commission: contractFormData.capital_commission ? parseInt(contractFormData.capital_commission) : 0,
        dealer_commission: contractFormData.dealer_commission ? parseInt(contractFormData.dealer_commission) : 0,
        payback: contractFormData.payback ? parseInt(contractFormData.payback) : 0,
        total_commission: calculateTotalCommission(),
        settlement_amount: contractFormData.settlement_amount ? parseInt(contractFormData.settlement_amount) : 0,
        contract_date: contractFormData.contract_date || null,
        execution_date: contractFormData.execution_date || null,
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
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">계약 등록</h2>
          </div>

          <form onSubmit={handleSaveContract} className="p-8 space-y-8">
            {/* 기본정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 담당 영업자
                  </label>
                  <input
                    type="text"
                    value={contractFormData.contractor}
                    onChange={(e) => setContractFormData({ ...contractFormData, contractor: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 고객명
                  </label>
                  <input
                    type="text"
                    value={contractFormData.customer_name}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">매체</label>
                  <input
                    type="text"
                    value={contractFormData.media}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
                  <input
                    type="text"
                    value={contractFormData.phone}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 고객 생년월일
                  </label>
                  <input
                    type="text"
                    value={contractFormData.birth_date}
                    onChange={(e) => setContractFormData({ ...contractFormData, birth_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="1984-02-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">특이사항</label>
                  <input
                    type="text"
                    value={contractFormData.special_notes}
                    onChange={(e) => setContractFormData({ ...contractFormData, special_notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="특이사항 입력"
                  />
                </div>
              </div>
            </div>

            {/* 계약정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">계약 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 판매구분
                  </label>
                  <div className="flex gap-2">
                    {['렌트', '리스', '일시불', '할부'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, sales_type: type })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          contractFormData.sales_type === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 제조사
                  </label>
                  <input
                    type="text"
                    value={contractFormData.manufacturer}
                    onChange={(e) => setContractFormData({ ...contractFormData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="현대"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">등록유형</label>
                  <div className="flex gap-2">
                    {['법인', '개인'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, registration_type: type })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          contractFormData.registration_type === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 계약경로
                  </label>
                  <input
                    type="text"
                    value={contractFormData.contract_route}
                    onChange={(e) => setContractFormData({ ...contractFormData, contract_route: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="하나캐피탈"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 차량명
                  </label>
                  <input
                    type="text"
                    value={contractFormData.vehicle_name}
                    onChange={(e) => setContractFormData({ ...contractFormData, vehicle_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="그랜저"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">차량가</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.vehicle_price)}
                      onChange={(e) => handleNumberInput('vehicle_price', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">계약기간</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={contractFormData.contract_period}
                      onChange={(e) => setContractFormData({ ...contractFormData, contract_period: e.target.value })}
                      className="w-24 px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="60"
                    />
                    <span className="text-sm text-gray-600">개월</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">초기비용</label>
                  <div className="flex gap-2">
                    {['선납금', '보증금', '없음'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, initial_cost_type: type, initial_cost_amount: type === '없음' ? '0' : contractFormData.initial_cost_amount })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          contractFormData.initial_cost_type === type
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {(contractFormData.initial_cost_type === '선납금' || contractFormData.initial_cost_type === '보증금') && (
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={formatNumber(contractFormData.initial_cost_amount)}
                        onChange={(e) => handleNumberInput('initial_cost_amount', e.target.value)}
                        className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">월 납입료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.monthly_payment)}
                      onChange={(e) => handleNumberInput('monthly_payment', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">대물</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.collateral)}
                      onChange={(e) => handleNumberInput('collateral', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="100000000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">억</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">실운전자</label>
                  <input
                    type="text"
                    value={contractFormData.actual_driver}
                    onChange={(e) => setContractFormData({ ...contractFormData, actual_driver: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">연간주행거리</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={contractFormData.annual_mileage}
                      onChange={(e) => setContractFormData({ ...contractFormData, annual_mileage: e.target.value })}
                      className="w-32 px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="10000"
                    />
                    <span className="text-sm text-gray-600">km</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 계약일
                  </label>
                  <input
                    type="date"
                    value={contractFormData.contract_date}
                    onChange={(e) => setContractFormData({ ...contractFormData, contract_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출고일</label>
                  <input
                    type="date"
                    value={contractFormData.delivery_date}
                    onChange={(e) => setContractFormData({ ...contractFormData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">계약 메모</label>
                  <textarea
                    value={contractFormData.contract_memo}
                    onChange={(e) => setContractFormData({ ...contractFormData, contract_memo: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                    placeholder="계약 관련 메모를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 출고정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">출고 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> 출고유형
                  </label>
                  <div className="flex gap-2">
                    {['대리점', '특판', '발주'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, delivery_type: type })}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          contractFormData.delivery_type === type
                            ? 'bg-gray-800 text-white shadow-md'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출고상태</label>
                  <div className="flex gap-2">
                    {['계약', '출고', '정산대기', '완료'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContractFormData({ ...contractFormData, delivery_status: type })}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                          contractFormData.delivery_status === type
                            ? 'bg-gray-800 text-white shadow-md'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">대리점명</label>
                  <input
                    type="text"
                    value={contractFormData.dealer_name}
                    onChange={(e) => setContractFormData({ ...contractFormData, dealer_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 서울모터스"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">대리점 딜러</label>
                  <input
                    type="text"
                    value={contractFormData.dealer_contact}
                    onChange={(e) => setContractFormData({ ...contractFormData, dealer_contact: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이상훈 010-0000-0000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출고 메모</label>
                  <textarea
                    value={contractFormData.delivery_memo}
                    onChange={(e) => setContractFormData({ ...contractFormData, delivery_memo: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="출고 관련 메모를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 수수료정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">수수료 정보</h3>
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">총 수수료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.total_commission)}
                      onChange={(e) => handleNumberInput('total_commission', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">AG 수수료</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.ag_commission)}
                      onChange={(e) => handleNumberInput('ag_commission', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">고객 지원금</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.customer_commission)}
                      onChange={(e) => handleNumberInput('customer_commission', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">캐피탈 수당</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.capital_commission)}
                      onChange={(e) => handleNumberInput('capital_commission', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">대리점 수당</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.dealer_commission)}
                      onChange={(e) => handleNumberInput('dealer_commission', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">페이백</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.payback)}
                      onChange={(e) => handleNumberInput('payback', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">정산금액</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(contractFormData.settlement_amount)}
                      onChange={(e) => handleNumberInput('settlement_amount', e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowContractForm(false)}
                className="flex-1 px-6 py-2.5 bg-white border border-gray-300 rounded text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSavingContract}
                className="flex-1 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingContract ? '저장 중...' : '저장'}
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">문의 상세</h2>
            <p className="text-sm text-gray-500 mt-1">
              등록일: {new Date(inquiry.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 고객 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">고객 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">매체</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.source || '카스피릿'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">고객명</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">번호</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.customer_phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">문의 내용</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-line">{inquiry.content}</p>
            </div>
          </div>

          {/* 상태 변경 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상태</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setStatus('신규')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '신규'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                신규
              </button>
              <button
                onClick={() => setStatus('관리')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '관리'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                관리
              </button>
              <button
                onClick={() => setStatus('부재')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '부재'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                부재
              </button>
              <button
                onClick={() => setStatus('심사')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '심사'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                심사
              </button>
              <button
                onClick={() => setStatus('가망')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '가망'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                가망
              </button>
              <button
                onClick={() => setStatus('계약')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '계약'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                계약
              </button>
            </div>
          </div>

          {/* 메모 목록 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상담 메모</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
              {isLoadingMemos ? (
                <p className="text-sm text-gray-500 text-center py-4">메모 로딩 중...</p>
              ) : memos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">작성된 메모가 없습니다</p>
              ) : (
                memos.map((memo) => (
                  <div key={memo.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-line mb-2">{memo.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-blue-600">{memo.user_name}</span>
                      <span>•</span>
                      <span>{formatDateTime(memo.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 메모 작성 */}
            <div className="mt-3">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="새 메모를 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSaveMemo}
                className="mt-2 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                메모 추가
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded transition-colors"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => setShowContractForm(true)}
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded transition-colors"
          >
            계약
          </button>
          <button
            onClick={handleLock}
            disabled={isLocking}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded transition-colors"
          >
            {isLocking ? '처리 중...' : userRole === 'admin' ? '7일 잠금 (무제한)' : '7일 잠금'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded transition-colors"
          >
            닫기
          </button>
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
    </div>
  )
}
