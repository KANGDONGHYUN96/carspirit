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
}

interface ContractsClientProps {
  contracts: Contract[]
  userName: string
}

export default function ContractsClient({ contracts: initialContracts, userName }: ContractsClientProps) {
  const [contracts, setContracts] = useState(initialContracts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    status: 'pending',
    media: '',
    phone: '',
    contractor: userName,
    capital: '',
    dealership: '',
    vehicle_name: '',
    vehicle_price: '',
    product_type: '',
    delivery_type: '',
    customer_documents: '',
    ag_commission: '',
    capital_commission: '',
    dealer_commission: '',
    payback: '',
    total_commission: '',
    settlement_amount: '',
    contract_date: '',
    execution_date: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const router = useRouter()

  // 총 수수료 자동 계산: AG수수료 + 캐피탈수당 + 대리점수당 - 페이백
  const calculateTotalCommission = () => {
    const ag = parseInt(formData.ag_commission) || 0
    const capital = parseInt(formData.capital_commission) || 0
    const dealer = parseInt(formData.dealer_commission) || 0
    const payback = parseInt(formData.payback) || 0
    return ag + capital + dealer - payback
  }

  // 숫자 포맷팅 함수 (콤마 추가)
  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  // 숫자 입력 핸들러
  const handleNumberInput = (field: string, value: string) => {
    const num = value.replace(/[^\d]/g, '')
    setFormData({ ...formData, [field]: num })
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
      setFormData({
        customer_name: contract.customer_name,
        status: contract.status,
        media: contract.media || '',
        phone: contract.phone || '',
        contractor: contract.contractor || '',
        capital: contract.capital || '',
        dealership: (contract as any).dealership || '',
        vehicle_name: contract.vehicle_name || '',
        vehicle_price: contract.vehicle_price?.toString() || '',
        product_type: contract.product_type || '',
        delivery_type: contract.delivery_type || '',
        customer_documents: contract.customer_documents || '',
        ag_commission: contract.ag_commission?.toString() || '',
        capital_commission: contract.capital_commission?.toString() || '',
        dealer_commission: contract.dealer_commission?.toString() || '',
        payback: contract.payback?.toString() || '',
        total_commission: contract.total_commission?.toString() || '',
        settlement_amount: contract.settlement_amount?.toString() || '',
        contract_date: contract.contract_date || '',
        execution_date: contract.execution_date || '',
      })
    } else {
      setEditingContract(null)
      setFormData({
        customer_name: '',
        status: 'pending',
        media: '',
        phone: '',
        contractor: userName,
        capital: '',
        dealership: '',
        vehicle_name: '',
        vehicle_price: '',
        product_type: '',
        delivery_type: '',
        customer_documents: '',
        ag_commission: '',
        capital_commission: '',
        dealer_commission: '',
        payback: '',
        total_commission: '',
        settlement_amount: '',
        contract_date: '',
        execution_date: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingContract(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingContract
        ? `/api/contracts/${editingContract.id}`
        : '/api/contracts'

      const payload = {
        ...formData,
        vehicle_price: formData.vehicle_price ? parseInt(formData.vehicle_price) : null,
        ag_commission: formData.ag_commission ? parseInt(formData.ag_commission) : 0,
        capital_commission: formData.capital_commission ? parseInt(formData.capital_commission) : 0,
        dealer_commission: formData.dealer_commission ? parseInt(formData.dealer_commission) : 0,
        payback: formData.payback ? parseInt(formData.payback) : 0,
        total_commission: calculateTotalCommission(),
        settlement_amount: formData.settlement_amount ? parseInt(formData.settlement_amount) : 0,
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

      closeModal()
      router.refresh()
    } catch (error) {
      setAlert({ message: '저장 실패', type: 'error' })
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
            <p className="text-sm text-gray-500">계약 정보를 관리하고 수수료를 확인하세요</p>
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
                <col style={{ width: '7%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">매체</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">고객명</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">번호</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">상태</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">담당자</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">캐피탈</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">상품구분</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">차량명</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">차량가</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">고객서류</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">계약일자</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 tracking-wide">실행일자</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 tracking-wide">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-5">
                      <button className="px-3 py-1.5 text-xs rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors truncate block">
                        {contract.media || '카스피릿'}
                      </button>
                    </td>
                    <td className="px-4 py-5 text-sm font-semibold text-gray-900 truncate">{contract.customer_name}</td>
                    <td className="px-4 py-5 text-sm text-gray-600 truncate">{contract.phone || '-'}</td>
                    <td className="px-4 py-5">{getStatusBadge(contract.status)}</td>
                    <td className="px-4 py-5 text-sm text-gray-600 truncate">{contract.contractor || '-'}</td>
                    <td className="px-4 py-5 text-sm text-gray-600 truncate">{contract.capital || '-'}</td>
                    <td className="px-4 py-5">
                      {contract.product_type ? getProductTypeBadge(contract.product_type) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-5 text-sm text-gray-900 truncate">{contract.vehicle_name || '-'}</td>
                    <td className="px-4 py-5 text-sm font-medium text-gray-900 truncate">
                      {contract.vehicle_price ? `${contract.vehicle_price.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-4 py-5">
                      {contract.customer_documents ? (
                        <a
                          href={contract.customer_documents}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium underline"
                        >
                          다운로드
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-sm text-gray-600 truncate">
                      {contract.contract_date || '-'}
                    </td>
                    <td className="px-4 py-5 text-sm text-gray-600 truncate">
                      {contract.execution_date || '-'}
                    </td>
                    <td className="px-4 py-5 text-right text-sm">
                      <button
                        onClick={() => openModal(contract)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        수정
                      </button>
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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingContract ? '계약 수정' : '새 계약 추가'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 고객 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">고객 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">고객명 *</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">전화번호</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* 계약 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">계약 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">상태</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'contract' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.status === 'contract'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        계약
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'delivery' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.status === 'delivery'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        출고
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'waiting' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.status === 'waiting'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        정산대기
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'completed' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        완료
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">매체</label>
                    <input
                      type="text"
                      value={formData.media}
                      onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="예: KS오토플랜"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">계약자</label>
                    <input
                      type="text"
                      value={formData.contractor}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">캐피탈</label>
                    <input
                      type="text"
                      value={formData.capital}
                      onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="예: 하나캐피탈"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">대리점</label>
                    <input
                      type="text"
                      value={formData.dealership}
                      onChange={(e) => setFormData({ ...formData, dealership: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="예: 서울현대대리점"
                    />
                  </div>
                </div>
              </div>

              {/* 차량 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">차량 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">차량명</label>
                    <input
                      type="text"
                      value={formData.vehicle_name}
                      onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="예: 쏘렌토 가솔린"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">차량가</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(formData.vehicle_price)}
                        onChange={(e) => handleNumberInput('vehicle_price', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">상품구분</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, product_type: '렌트' })}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.product_type === '렌트'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        렌트
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, product_type: '리스' })}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.product_type === '리스'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        리스
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">출고유형</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, delivery_type: '특판' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.delivery_type === '특판'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        특판
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, delivery_type: '대리점' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.delivery_type === '대리점'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        대리점
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, delivery_type: '발주' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.delivery_type === '발주'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }`}
                      >
                        발주
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">고객서류</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept=".hwp,.hwpx,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {isUploading && (
                          <span className="text-sm text-blue-600 self-center">업로드 중...</span>
                        )}
                      </div>
                      {formData.customer_documents && (() => {
                        try {
                          const files = JSON.parse(formData.customer_documents)
                          const fileArray = Array.isArray(files) ? files : [formData.customer_documents]
                          return (
                            <div className="space-y-2">
                              {fileArray.map((fileUrl, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="flex-1 text-sm text-gray-700 truncate">파일 {index + 1}</span>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-all"
                                  >
                                    보기
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleFileDelete(fileUrl)}
                                    className="px-3 py-1 text-xs text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-all"
                                  >
                                    삭제
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        } catch {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="flex-1 text-sm text-gray-700">파일 1</span>
                              <a
                                href={formData.customer_documents}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-all"
                              >
                                보기
                              </a>
                              <button
                                type="button"
                                onClick={() => handleFileDelete(formData.customer_documents)}
                                className="px-3 py-1 text-xs text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-all"
                              >
                                삭제
                              </button>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 수수료 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">수수료 정보</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">AG수수료</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(formData.ag_commission)}
                        onChange={(e) => handleNumberInput('ag_commission', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">캐피탈 수당</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(formData.capital_commission)}
                        onChange={(e) => handleNumberInput('capital_commission', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">대리점 수당</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(formData.dealer_commission)}
                        onChange={(e) => handleNumberInput('dealer_commission', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">페이백</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(formData.payback)}
                        onChange={(e) => handleNumberInput('payback', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">총 수수료</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={calculateTotalCommission().toLocaleString()}
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold transition-all duration-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 날짜 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">날짜 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">계약일자</label>
                    <input
                      type="date"
                      value={formData.contract_date}
                      onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">실행일자</label>
                    <input
                      type="date"
                      value={formData.execution_date}
                      onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
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
    </div>
  )
}
