'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomAlert from '@/components/common/custom-alert'

interface Contract {
  id: string
  customer_name: string
  status: string
  media: string | null
  phone: string | null
  contractor: string | null
  capital: string | null
  dealership: string | null
  vehicle_name: string | null
  vehicle_price: number | null
  product_type: string | null
  delivery_type: string | null
  customer_documents: string | null
  ag_commission: number
  capital_commission: number
  dealer_commission: number
  payback: number
  total_commission: number
  settlement_amount: number
  contract_date: string | null
  execution_date: string | null
  created_at: string
  finance_company: string | null
  sales_type: string | null
}

interface ContractsClientProps {
  contracts: Contract[]
  userName: string
  userRole: string
}

export default function ContractsClient({ contracts: initialContracts, userName, userRole }: ContractsClientProps) {
  const isAdmin = userRole === 'admin' || userRole === 'manager'
  const [contracts, setContracts] = useState(initialContracts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // 기본정보
    media: '',
    contractor: userName,
    customer_name: '',
    phone: '',
    funding_same: true,
    funding_name: '',
    funding_phone: '',
    birth_date: '',
    special_notes: '',

    // 차량정보
    vehicle_name: '',
    vehicle_options: '',
    vehicle_color: '',
    vehicle_price: '',

    // 계약정보
    status: 'contract',
    sales_type: '',
    contract_period: '',
    annual_mileage: '',
    initial_cost_type: '',
    initial_cost_amount: '',
    monthly_payment: '',
    insurance_age: '',
    car_tax_included: '',
    customer_support: '',
    contract_type: '',
    contract_route: '',
    finance_company: '',
    dealer_name: '',
    manufacturer_dealer: '',
    capital: '',
    dealership: '',
    product_type: '',
    delivery_type: '',
    contract_date: '',
    execution_date: '',

    // 수수료정보
    ag_commission: '',
    finance_commission: '',
    dealer_commission: '',
    other_commission: '',
    customer_support_amount: '',
    total_commission: '',

    // 파일
    customer_documents: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [isPartialEditing, setIsPartialEditing] = useState(false)
  const [partialEditData, setPartialEditData] = useState({ status: '', execution_date: '' })
  const router = useRouter()

  // 총 수수료 자동 계산: AG + 금융사 + 대리점 + 기타 - 고객지원금
  const calculateTotalCommission = () => {
    const ag = parseInt(formData.ag_commission) || 0
    const finance = parseInt(formData.finance_commission) || 0
    const dealer = parseInt(formData.dealer_commission) || 0
    const other = parseInt(formData.other_commission) || 0
    const customerSupport = parseInt(formData.customer_support_amount) || 0
    return ag + finance + dealer + other - customerSupport
  }

  // 숫자 포맷팅 함수 (콤마 추가)
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
    setFormData({ ...formData, [field]: num })
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
      setFormData({ ...formData, birth_date: `${year}-${month}-${day}` })
    } else if (numOnly.length <= 8) {
      setFormData({ ...formData, birth_date: numOnly })
    } else {
      // 이미 포맷팅된 값이면 그대로 유지
      setFormData({ ...formData, birth_date: value })
    }
  }

  // 폼 유효성 검사 함수
  const validateForm = (): string[] => {
    const errors: string[] = []

    // 필수 필드 정의 (특이사항 제외)
    const requiredFields: { field: keyof typeof formData; label: string; condition?: boolean }[] = [
      // 기본정보
      { field: 'media', label: '매체' },
      { field: 'contractor', label: '담당자' },
      { field: 'customer_name', label: '고객명' },
      { field: 'phone', label: '연락처' },
      { field: 'birth_date', label: '고객 생년월일' },
      // 펀딩 미동일 시 추가 필수
      { field: 'funding_name', label: '펀딩 고객명', condition: !formData.funding_same },
      { field: 'funding_phone', label: '펀딩 고객 연락처', condition: !formData.funding_same },
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
      { field: 'finance_company', label: '금융사', condition: formData.contract_route === '특판' },
      { field: 'dealer_name', label: '대리점명', condition: formData.contract_route === '대리점' },
      { field: 'manufacturer_dealer', label: '제조사 딜러', condition: formData.contract_route === '대리점' },
      // 초기비용 금액 (선납금/보증금 선택 시)
      { field: 'initial_cost_amount', label: '초기비용 금액', condition: formData.initial_cost_type === '선납금' || formData.initial_cost_type === '보증금' },
      // 날짜
      { field: 'contract_date', label: '계약일자' },
      // 수수료정보
      { field: 'ag_commission', label: 'AG 수수료' },
    ]

    for (const { field, label, condition } of requiredFields) {
      // condition이 false인 경우 검사 건너뛰기
      if (condition === false) continue

      const value = formData[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(label)
      }
    }

    return errors
  }

  // 파일 업로드 핸들러
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
        console.error('파일 업로드 실패:', errorData)
        throw new Error(errorData.error || '파일 업로드 실패')
      }

      const data = await response.json()

      // 기존 파일들을 배열로 파싱
      let existingFiles: string[] = []
      if (formData.customer_documents) {
        try {
          existingFiles = JSON.parse(formData.customer_documents)
          if (!Array.isArray(existingFiles)) {
            existingFiles = [formData.customer_documents]
          }
        } catch {
          existingFiles = [formData.customer_documents]
        }
      }

      // 새 파일 URL 추가
      const updatedFiles = [...existingFiles, data.url]
      setFormData({ ...formData, customer_documents: JSON.stringify(updatedFiles) })
      setAlert({ message: '파일 업로드 완료', type: 'success' })
    } catch (error: any) {
      setAlert({ message: `파일 업로드 실패: ${error.message}`, type: 'error' })
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  // 파일 삭제 핸들러
  const handleFileDelete = (fileUrl: string) => {
    try {
      let existingFiles: string[] = []
      if (formData.customer_documents) {
        try {
          existingFiles = JSON.parse(formData.customer_documents)
          if (!Array.isArray(existingFiles)) {
            existingFiles = [formData.customer_documents]
          }
        } catch {
          existingFiles = [formData.customer_documents]
        }
      }

      const updatedFiles = existingFiles.filter(url => url !== fileUrl)
      setFormData({ ...formData, customer_documents: updatedFiles.length > 0 ? JSON.stringify(updatedFiles) : '' })
      setAlert({ message: '파일이 삭제되었습니다', type: 'success' })
    } catch (error: any) {
      setAlert({ message: '파일 삭제 실패', type: 'error' })
    }
  }

  const openModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract)
      setIsPartialEditing(false)
      setPartialEditData({
        status: contract.status,
        execution_date: contract.execution_date || ''
      })
      setFormData({
        // 기본정보
        media: contract.media || '',
        contractor: contract.contractor || '',
        customer_name: contract.customer_name,
        phone: contract.phone || '',
        funding_same: (contract as any).funding_same ?? true,
        funding_name: (contract as any).funding_name || '',
        funding_phone: (contract as any).funding_phone || '',
        birth_date: (contract as any).birth_date || '',
        special_notes: (contract as any).special_notes || '',

        // 차량정보
        vehicle_name: contract.vehicle_name || '',
        vehicle_options: (contract as any).vehicle_options || '',
        vehicle_color: (contract as any).vehicle_color || '',
        vehicle_price: contract.vehicle_price?.toString() || '',

        // 계약정보
        status: contract.status,
        sales_type: (contract as any).sales_type || '',
        contract_period: (contract as any).contract_period || '',
        annual_mileage: (contract as any).annual_mileage || '',
        initial_cost_type: (contract as any).initial_cost_type || '',
        initial_cost_amount: (contract as any).initial_cost_amount || '',
        monthly_payment: (contract as any).monthly_payment || '',
        insurance_age: (contract as any).insurance_age || '',
        car_tax_included: (contract as any).car_tax_included || '',
        customer_support: (contract as any).customer_support || '',
        contract_type: (contract as any).contract_type || '',
        contract_route: (contract as any).contract_route || '',
        finance_company: (contract as any).finance_company || '',
        dealer_name: (contract as any).dealer_name || '',
        manufacturer_dealer: (contract as any).manufacturer_dealer || '',
        capital: contract.capital || '',
        dealership: (contract as any).dealership || '',
        product_type: contract.product_type || '',
        delivery_type: contract.delivery_type || '',
        contract_date: contract.contract_date || '',
        execution_date: contract.execution_date || '',

        // 수수료정보
        ag_commission: contract.ag_commission?.toString() || '',
        finance_commission: (contract as any).finance_commission?.toString() || '',
        dealer_commission: contract.dealer_commission?.toString() || '',
        other_commission: (contract as any).other_commission?.toString() || '',
        customer_support_amount: (contract as any).customer_support_amount?.toString() || '',
        total_commission: contract.total_commission?.toString() || '',

        // 파일
        customer_documents: contract.customer_documents || '',
      })
    } else {
      setEditingContract(null)
      setFormData({
        // 기본정보
        media: '',
        contractor: userName,
        customer_name: '',
        phone: '',
        funding_same: true,
        funding_name: '',
        funding_phone: '',
        birth_date: '',
        special_notes: '',

        // 차량정보
        vehicle_name: '',
        vehicle_options: '',
        vehicle_color: '',
        vehicle_price: '',

        // 계약정보
        status: 'contract',
        sales_type: '',
        contract_period: '',
        annual_mileage: '',
        initial_cost_type: '',
        initial_cost_amount: '',
        monthly_payment: '',
        insurance_age: '',
        car_tax_included: '',
        customer_support: '',
        contract_type: '',
        contract_route: '',
        finance_company: '',
        dealer_name: '',
        manufacturer_dealer: '',
        capital: '',
        dealership: '',
        product_type: '',
        delivery_type: '',
        contract_date: '',
        execution_date: '',

        // 수수료정보
        ag_commission: '',
        finance_commission: '',
        dealer_commission: '',
        other_commission: '',
        customer_support_amount: '',
        total_commission: '',

        // 파일
        customer_documents: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingContract(null)
    setIsPartialEditing(false)
  }

  // 부분 수정 저장 (상태, 출고일자만)
  const handlePartialSave = async () => {
    if (!editingContract) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/contracts/${editingContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: partialEditData.status,
          execution_date: partialEditData.execution_date || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '저장 실패')
      }

      setAlert({ message: '저장되었습니다', type: 'success' })
      setIsPartialEditing(false)
      closeModal()
      router.refresh()
    } catch (error: any) {
      setAlert({ message: `저장 실패: ${error.message}`, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }

    setIsSaving(true)

    try {
      const url = editingContract
        ? `/api/contracts/${editingContract.id}`
        : '/api/contracts'

      const payload = {
        ...formData,
        contractor: isAdmin ? formData.contractor : userName, // 관리자는 폼에서 입력한 담당자, 일반 사용자는 로그인한 사용자로 고정
        vehicle_price: formData.vehicle_price ? parseInt(formData.vehicle_price) : null,
        annual_mileage: formData.annual_mileage ? parseInt(formData.annual_mileage) : null,
        initial_cost_amount: formData.initial_cost_amount ? parseInt(formData.initial_cost_amount) : null,
        monthly_payment: formData.monthly_payment ? parseInt(formData.monthly_payment) : null,
        ag_commission: formData.ag_commission ? parseInt(formData.ag_commission) : 0,
        finance_commission: formData.finance_commission ? parseInt(formData.finance_commission) : 0,
        dealer_commission: formData.dealer_commission ? parseInt(formData.dealer_commission) : 0,
        other_commission: formData.other_commission ? parseInt(formData.other_commission) : 0,
        customer_support_amount: formData.customer_support_amount ? parseInt(formData.customer_support_amount) : 0,
        total_commission: calculateTotalCommission(),
        contract_date: formData.contract_date || null,
        execution_date: formData.execution_date || null,
      }

      const response = await fetch(url, {
        method: editingContract ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('저장 실패:', errorData)
        throw new Error(errorData.error || '저장 실패')
      }

      setAlert({ message: editingContract ? '계약이 수정되었습니다.' : '계약이 등록되었습니다.', type: 'success' })
      closeModal()
      router.refresh()
    } catch (error: any) {
      setAlert({ message: error.message || '저장 실패', type: 'error' })
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }


  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      contract: { label: '계약', className: 'bg-blue-100 text-blue-800' },
      delivery: { label: '출고', className: 'bg-purple-100 text-purple-800' },
      waiting: { label: '정산대기', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '완료', className: 'bg-green-100 text-green-800' },
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <button className={`px-3 py-1 text-xs rounded-lg font-medium ${statusInfo.className} cursor-pointer hover:opacity-80 transition-opacity`}>
        {statusInfo.label}
      </button>
    )
  }

  const getProductTypeBadge = (productType: string) => {
    const productMap: { [key: string]: { label: string; className: string } } = {
      '렌트': { label: '렌트', className: 'bg-green-100 text-green-800' },
      '리스': { label: '리스', className: 'bg-blue-100 text-blue-800' },
    }
    const productInfo = productMap[productType] || { label: productType, className: 'bg-gray-100 text-gray-800' }
    return (
      <button className={`px-3 py-1 text-xs rounded-lg font-medium ${productInfo.className} cursor-pointer hover:opacity-80 transition-opacity`}>
        {productInfo.label}
      </button>
    )
  }

  // 필터링된 계약 목록
  const filteredContracts = statusFilter
    ? contracts.filter(contract => contract.status === statusFilter)
    : contracts

  return (
    <div>
      {/* 헤더 영역 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">계약관리</h1>
            <p className="text-sm text-gray-500">계약 정보를 조회합니다</p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            + 새 계약 추가
          </button>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              statusFilter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setStatusFilter('contract')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              statusFilter === 'contract'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            계약
          </button>
          <button
            onClick={() => setStatusFilter('delivery')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              statusFilter === 'delivery'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            출고
          </button>
          <button
            onClick={() => setStatusFilter('waiting')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              statusFilter === 'waiting'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            정산대기
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            완료
          </button>
        </div>
      </div>

      {/* 계약 목록 */}
      <div className="bg-white border border-gray-200">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">등록된 계약이 없습니다</p>
            <p className="text-sm mt-2">새 계약을 추가해보세요</p>
          </div>
        ) : (
          <div>
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '7%' }} />
              </colgroup>
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">매체</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">고객명</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">번호</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">상태</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">담당자</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">금융사</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">판매구분</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">차량명</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">차량가</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">총수수료</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">정산금액</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">계약일</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">출고일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => openModal(contract)}
                  >
                    <td className="px-3 py-4">
                      <span className="px-2 py-1 text-xs rounded-lg font-medium bg-gray-900 text-white truncate block">
                        {contract.media || '카스피릿'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-gray-900 truncate">{contract.customer_name}</td>
                    <td className="px-3 py-4 text-sm text-gray-600 truncate">{contract.phone || '-'}</td>
                    <td className="px-3 py-4">{getStatusBadge(contract.status)}</td>
                    <td className="px-3 py-4 text-sm text-gray-600 truncate">{contract.contractor || '-'}</td>
                    <td className="px-3 py-4 text-sm text-gray-600 truncate">{contract.finance_company || '-'}</td>
                    <td className="px-3 py-4">
                      {contract.sales_type ? (
                        <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                          contract.sales_type === '렌트' ? 'bg-green-100 text-green-800' :
                          contract.sales_type === '리스' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.sales_type}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate">{contract.vehicle_name || '-'}</td>
                    <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">
                      {contract.vehicle_price ? `${contract.vehicle_price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-blue-600 truncate">
                      {contract.total_commission ? `${contract.total_commission.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-green-600 truncate">
                      {contract.settlement_amount ? `${contract.settlement_amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600 truncate">
                      {contract.contract_date || '-'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600 truncate">
                      {contract.execution_date || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-200 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingContract ? '계약 상세 정보' : '새 계약 추가'}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 읽기 전용 모드 (기존 계약 조회 시) - 노션 스타일 */}
            {editingContract ? (
              <div className="p-6">
                {/* 계약자명 (상단 크게) */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {formData.funding_same ? formData.customer_name : (formData.funding_name || formData.customer_name)}
                  </h1>
                  {!formData.funding_same && formData.funding_name && (
                    <p className="text-sm text-gray-500 mt-1">문의자: {formData.customer_name} {formData.phone}</p>
                  )}
                </div>

                {/* 상태 수정 */}
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">상태</span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    {[
                      { value: 'contract', label: '계약', bgActive: 'bg-blue-500 text-white', bgInactive: 'bg-blue-100 text-blue-800' },
                      { value: 'delivery', label: '출고', bgActive: 'bg-purple-500 text-white', bgInactive: 'bg-purple-100 text-purple-800' },
                      { value: 'waiting', label: '정산대기', bgActive: 'bg-yellow-500 text-white', bgInactive: 'bg-yellow-100 text-yellow-800' },
                      { value: 'completed', label: '완료', bgActive: 'bg-green-500 text-white', bgInactive: 'bg-green-100 text-green-800' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setPartialEditData({ ...partialEditData, status: item.value })
                          setIsPartialEditing(true)
                        }}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                          partialEditData.status === item.value ? item.bgActive : item.bgInactive
                        } hover:opacity-80`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 기본정보 섹션 */}
                <div className="mt-6 mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">기본정보</h3>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className="text-sm text-gray-500">매체</span>
                  </div>
                  <span className="flex-1"><span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-900 text-white">{formData.media || '카스피릿'}</span></span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-500">담당자</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.contractor || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">문의자</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.customer_name || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-500">문의자 연락처</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.phone || '-'}</span>
                </div>
                {!formData.funding_same && (
                  <>
                    <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                      <div className="flex items-center gap-2 w-40">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-500">계약자</span>
                      </div>
                      <span className="flex-1 text-sm text-gray-900">{formData.funding_name || '-'}</span>
                    </div>
                    <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                      <div className="flex items-center gap-2 w-40">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-gray-500">계약자 연락처</span>
                      </div>
                      <span className="flex-1 text-sm text-gray-900">{formData.funding_phone || '-'}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                    </svg>
                    <span className="text-sm text-gray-500">생년월일</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.birth_date || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-sm text-gray-500">특이사항</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.special_notes || '-'}</span>
                </div>

                {/* 차량정보 섹션 */}
                <div className="mt-6 mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">차량정보</h3>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span className="text-sm text-gray-500">차량명</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.vehicle_name || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="text-sm text-gray-500">옵션</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.vehicle_options || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm text-gray-500">색상</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.vehicle_color || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">차량가</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.vehicle_price ? formatNumber(formData.vehicle_price) : '0'}</span>
                </div>

                {/* 계약정보 섹션 */}
                <div className="mt-6 mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">계약정보</h3>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm text-gray-500">판매구분</span>
                  </div>
                  <span className="flex-1">
                    {formData.sales_type ? (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        formData.sales_type === '렌트' ? 'bg-green-100 text-green-800' :
                        formData.sales_type === '리스' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{formData.sales_type}</span>
                    ) : '-'}
                  </span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">계약기간</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.contract_period ? `${formData.contract_period}개월` : '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm text-gray-500">연간주행거리</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.annual_mileage ? `${formatNumber(formData.annual_mileage)}km` : '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">초기비용</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.initial_cost_type || '-'} {formData.initial_cost_amount ? `(₩${formatNumber(formData.initial_cost_amount)})` : ''}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">월납입료</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.monthly_payment ? `₩${formatNumber(formData.monthly_payment)}` : '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-gray-500">보험연령</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.insurance_age || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">자동차세</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.car_tax_included || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">고객지원</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.customer_support || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">계약유형</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.contract_type || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm text-gray-500">계약경로</span>
                  </div>
                  <span className="flex-1">
                    {formData.contract_route ? (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        formData.contract_route === '특판' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>{formData.contract_route}</span>
                    ) : '-'}
                  </span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-500">금융사</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.finance_company || '-'}</span>
                </div>
                {formData.contract_route === '대리점' && (
                  <>
                    <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                      <div className="flex items-center gap-2 w-40">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm text-gray-500">대리점명</span>
                      </div>
                      <span className="flex-1 text-sm text-gray-900">{formData.dealer_name || '-'}</span>
                    </div>
                    <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                      <div className="flex items-center gap-2 w-40">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-500">제조사 딜러</span>
                      </div>
                      <span className="flex-1 text-sm text-gray-900">{formData.manufacturer_dealer || '-'}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">계약일자</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{formData.contract_date || '-'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">실행일자</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={partialEditData.execution_date}
                      onChange={(e) => {
                        setPartialEditData({ ...partialEditData, execution_date: e.target.value })
                        setIsPartialEditing(true)
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* 수수료 정보 섹션 */}
                <div className="mt-6 mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">수수료 정보</h3>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">AG수수료</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.ag_commission ? formatNumber(formData.ag_commission) : '0'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">금융사 수당</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.finance_commission ? formatNumber(formData.finance_commission) : '0'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm text-gray-500">대리점 수당</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.dealer_commission ? formatNumber(formData.dealer_commission) : '0'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-500">기타 수당</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.other_commission ? formatNumber(formData.other_commission) : '0'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">고객지원금</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">₩{formData.customer_support_amount ? formatNumber(formData.customer_support_amount) : '0'}</span>
                </div>
                <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 bg-blue-50">
                  <div className="flex items-center gap-2 w-40">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">총 수수료</span>
                  </div>
                  <span className="flex-1 text-sm font-bold text-blue-600">₩{formatNumber(String(calculateTotalCommission()))}</span>
                </div>
                {editingContract?.settlement_amount ? (
                  <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 bg-green-50">
                    <div className="flex items-center gap-2 w-40">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-600 font-medium">정산금액</span>
                    </div>
                    <span className="flex-1 text-sm font-bold text-green-600">₩{formatNumber(String(editingContract.settlement_amount))}</span>
                  </div>
                ) : null}

                {/* 고객서류 섹션 */}
                {formData.customer_documents && (
                  <>
                    <div className="mt-6 mb-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">고객서류</h3>
                    </div>
                    <div className="flex items-start py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                      <div className="flex items-center gap-2 w-40 pt-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-500">첨부파일</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const files = JSON.parse(formData.customer_documents)
                            if (Array.isArray(files)) {
                              return files.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  첨부파일 {idx + 1}
                                </a>
                              ))
                            }
                          } catch {
                            return null
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {/* 버튼 영역 */}
                <div className="flex justify-end gap-3 pt-4">
                  {isPartialEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPartialEditData({
                            status: editingContract?.status || '',
                            execution_date: editingContract?.execution_date || ''
                          })
                          setIsPartialEditing(false)
                        }}
                        className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handlePartialSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      닫기
                    </button>
                  )}
                </div>
              </div>
            ) : (
            /* 새 계약 추가 폼 */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 1. 기본정보 */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">기본정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">매체</label>
                    <input
                      type="text"
                      value={formData.media}
                      onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="카스피릿"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">담당자</label>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={formData.contractor}
                        onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      />
                    ) : (
                      <input
                        type="text"
                        value={userName}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600 cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">고객명 *</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 mb-3">
                    <label className="text-xs font-medium text-gray-700">펀딩 접수 고객</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, funding_same: true, funding_name: '', funding_phone: '' })}
                        className={`px-3 py-1 text-xs rounded ${formData.funding_same ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                      >
                        동일
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, funding_same: false })}
                        className={`px-3 py-1 text-xs rounded ${!formData.funding_same ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                      >
                        미동일
                      </button>
                    </div>
                  </div>
                  {!formData.funding_same && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">펀딩 고객명</label>
                        <input
                          type="text"
                          value={formData.funding_name}
                          onChange={(e) => setFormData({ ...formData, funding_name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          placeholder="고객명 입력"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">펀딩 고객 연락처</label>
                        <input
                          type="text"
                          value={formData.funding_phone}
                          onChange={(e) => setFormData({ ...formData, funding_phone: e.target.value })}
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
                      value={formData.birth_date}
                      onChange={(e) => handleBirthDateInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="19961112 또는 1996-11-12"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">특이사항</label>
                    <input
                      type="text"
                      value={formData.special_notes}
                      onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
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
                      value={formData.vehicle_name}
                      onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="26MY 카니발 HEV 9인승 프레스티지 2WD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">옵션</label>
                    <input
                      type="text"
                      value={formData.vehicle_options}
                      onChange={(e) => setFormData({ ...formData, vehicle_options: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      placeholder="컨비니언스, 스타일, 드라이브와이즈"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">색상</label>
                      <input
                        type="text"
                        value={formData.vehicle_color}
                        onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        placeholder="스노우화이트펄 / 토프"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">차량가</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatNumber(formData.vehicle_price)}
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
                    <label className="block text-xs text-gray-500 mb-2">상태</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'contract', label: '계약', color: 'blue' },
                        { value: 'delivery', label: '출고', color: 'purple' },
                        { value: 'waiting', label: '정산대기', color: 'yellow' },
                        { value: 'completed', label: '완료', color: 'green' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: item.value })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.status === item.value
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">판매구분</label>
                    <div className="flex gap-2">
                      {['렌트', '리스', '기타'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, sales_type: type })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.sales_type === type
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
                        value={formData.contract_period}
                        onChange={(e) => setFormData({ ...formData, contract_period: e.target.value })}
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
                          value={formatNumber(formData.annual_mileage)}
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
                          onClick={() => setFormData({ ...formData, initial_cost_type: type, initial_cost_amount: type === '없음' ? '' : formData.initial_cost_amount })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.initial_cost_type === type
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                      {(formData.initial_cost_type === '선납금' || formData.initial_cost_type === '보증금') && (
                        <div className="relative flex-1 min-w-[150px]">
                          <input
                            type="text"
                            value={formatNumber(formData.initial_cost_amount)}
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
                        value={formatNumber(formData.monthly_payment)}
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
                      {['만21세', '만26세', '만35세', '자체가입'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, insurance_age: type })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.insurance_age === type
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
                            onClick={() => setFormData({ ...formData, car_tax_included: type })}
                            className={`flex-1 px-4 py-2 text-xs rounded transition-all ${
                              formData.car_tax_included === type
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
                            onClick={() => setFormData({ ...formData, contract_type: type })}
                            className={`flex-1 px-4 py-2 text-xs rounded transition-all ${
                              formData.contract_type === type
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
                          onClick={() => setFormData({ ...formData, customer_support: type })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.customer_support === type
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
                          onClick={() => setFormData({ ...formData, contract_route: type, finance_company: '', dealer_name: '', manufacturer_dealer: '' })}
                          className={`px-4 py-2 text-xs rounded transition-all ${
                            formData.contract_route === type
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {formData.contract_route === '특판' && (
                      <div>
                        <input
                          type="text"
                          value={formData.finance_company}
                          onChange={(e) => setFormData({ ...formData, finance_company: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                          placeholder="금융사 입력"
                        />
                      </div>
                    )}
                    {formData.contract_route === '대리점' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={formData.dealer_name}
                            onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                            placeholder="대리점명 (예: 강남대리점)"
                          />
                          <input
                            type="text"
                            value={formData.manufacturer_dealer}
                            onChange={(e) => setFormData({ ...formData, manufacturer_dealer: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                            placeholder="제조사 딜러 (홍길동/010-0000-0000)"
                          />
                        </div>
                        <input
                          type="text"
                          value={formData.finance_company}
                          onChange={(e) => setFormData({ ...formData, finance_company: e.target.value })}
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
                        value={formData.contract_date}
                        onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">실행일자</label>
                      <input
                        type="date"
                        value={formData.execution_date}
                        onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
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
                        value={formatNumber(formData.ag_commission)}
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
                        value={formatNumber(formData.finance_commission)}
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
                        value={formatNumber(formData.dealer_commission)}
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
                        value={formatNumber(formData.other_commission)}
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
                        value={formatNumber(formData.customer_support_amount)}
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
                {formData.customer_documents && (
                  <div className="mt-3 space-y-2">
                    {(() => {
                      try {
                        const files = JSON.parse(formData.customer_documents)
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
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
