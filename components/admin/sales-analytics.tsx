'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface Contract {
  id: string
  user_id: string | null
  contractor: string | null
  customer_name: string
  vehicle_name: string
  brand: string
  capital: string
  contract_type: string
  status: string
  ag_commission: number
  capital_commission: number
  dealer_commission: number
  payback: number
  total_commission: number
  settlement_amount: number
  contract_date: string | null
  execution_date: string | null
  created_at: string
  media: string | null
  dealership: string | null
  product_type: string | null
  delivery_type: string | null
  customer_documents: string | null
}

interface User {
  id: string
  name: string
  role: string
}

interface SalesAnalyticsProps {
  contracts: Contract[]
  users: User[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']

export default function SalesAnalytics({ contracts, users }: SalesAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month' | 'week'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'sales' | 'settlement'>('sales')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const itemsPerPage = 20

  // 기간별 필터링
  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter(c => c.contract_date || c.execution_date)

    // 사용자 필터
    if (selectedUser !== 'all') {
      filtered = filtered.filter(c => c.user_id === selectedUser)
    }

    // 기간 필터
    const now = new Date()
    filtered = filtered.filter(contract => {
      const date = new Date(contract.contract_date || contract.execution_date!)

      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return date >= weekAgo
        case 'month':
          return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth
        case 'year':
          return date.getFullYear() === selectedYear
        case 'all':
        default:
          return true
      }
    })

    return filtered
  }, [contracts, selectedPeriod, selectedYear, selectedMonth, selectedUser])

  // 통계 계산
  const stats = useMemo(() => {
    const totalContracts = filteredContracts.length
    const completedContracts = filteredContracts.filter(c => c.status === 'completed').length

    const totalCommission = filteredContracts.reduce((sum, c) => sum + (c.total_commission || 0), 0)
    const totalSettlement = filteredContracts.reduce((sum, c) => sum + (c.settlement_amount || 0), 0)
    const totalAGCommission = filteredContracts.reduce((sum, c) => sum + (c.ag_commission || 0), 0)
    const totalCapitalCommission = filteredContracts.reduce((sum, c) => sum + (c.capital_commission || 0), 0)
    const totalDealerCommission = filteredContracts.reduce((sum, c) => sum + (c.dealer_commission || 0), 0)
    const totalPayback = filteredContracts.reduce((sum, c) => sum + (c.payback || 0), 0)

    // 캐피탈별 통계
    const byCapital = filteredContracts.reduce((acc, contract) => {
      const capital = contract.capital || '기타'
      if (!acc[capital]) {
        acc[capital] = { count: 0, commission: 0 }
      }
      acc[capital].count++
      acc[capital].commission += contract.total_commission || 0
      return acc
    }, {} as Record<string, { count: number; commission: number }>)

    // 영업자별 통계
    const bySalesperson = filteredContracts.reduce((acc, contract) => {
      const userId = contract.user_id || 'unknown'
      const user = users.find(u => u.id === userId)
      const userName = user?.name || '미지정'

      if (!acc[userName]) {
        acc[userName] = { count: 0, commission: 0 }
      }
      acc[userName].count++
      acc[userName].commission += contract.total_commission || 0
      return acc
    }, {} as Record<string, { count: number; commission: number }>)

    // 월별 추이 (연도별 또는 전체 기간 선택시)
    const monthlyTrend = filteredContracts.reduce((acc, contract) => {
      const date = new Date(contract.contract_date || contract.execution_date!)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, commission: 0, settlement: 0 }
      }
      acc[monthKey].count++
      acc[monthKey].commission += contract.total_commission || 0
      acc[monthKey].settlement += contract.settlement_amount || 0
      return acc
    }, {} as Record<string, { count: number; commission: number; settlement: number }>)

    return {
      totalContracts,
      completedContracts,
      totalCommission,
      totalSettlement,
      totalAGCommission,
      totalCapitalCommission,
      totalDealerCommission,
      totalPayback,
      byCapital,
      bySalesperson,
      monthlyTrend
    }
  }, [filteredContracts, users])

  // 차트 데이터 준비
  const capitalChartData = Object.entries(stats.byCapital)
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 8)
    .map(([name, data]) => ({
      name,
      수수료: data.commission,
      건수: data.count
    }))

  const salespersonChartData = Object.entries(stats.bySalesperson)
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 8)
    .map(([name, data]) => ({
      name,
      수수료: data.commission,
      건수: data.count
    }))

  const monthlyTrendData = Object.entries(stats.monthlyTrend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      월: month,
      매출: data.commission,
      정산금: data.settlement,
      건수: data.count
    }))

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      contract: '계약',
      delivery: '출고',
      waiting: '정산대기',
      completed: '완료'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      contract: 'bg-blue-100 text-blue-800',
      delivery: 'bg-purple-100 text-purple-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  // 페이지네이션
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage)
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            매출 차트
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'settlement'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            정산금 차트
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'week'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          최근 7일
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'month'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          월별
        </button>
        <button
          onClick={() => setSelectedPeriod('year')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'year'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          연도별
        </button>
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          전체
        </button>

        {/* 연도 선택 */}
        {(selectedPeriod === 'year' || selectedPeriod === 'month') && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        )}

        {/* 월 선택 */}
        {selectedPeriod === 'month' && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
        )}

        {/* 영업자 선택 */}
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">전체 영업자</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>

      {/* 메인 타임라인 섹션 - 매출 또는 정산금 */}
      {monthlyTrendData.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {activeTab === 'sales' ? '매출 타임라인' : '정산금 타임라인'}
          </h2>

          {/* 타임라인 */}
          <div className="relative">
            {/* 중앙 세로선 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>

            {/* 타임라인 아이템들 */}
            <div className="space-y-16">
              {monthlyTrendData.map((item, index) => {
                const amount = activeTab === 'sales' ? item.매출 : item.정산금
                const isLeft = index % 2 === 0

                return (
                  <div key={item.월} className="relative">
                    {/* 중앙 도트 */}
                    <div className={`absolute left-1/2 top-0 w-3 h-3 rounded-full ${activeTab === 'sales' ? 'bg-blue-500' : 'bg-green-500'} transform -translate-x-1/2 z-10`}></div>

                    {/* 컨텐츠 */}
                    <div className={`flex ${isLeft ? 'justify-end' : 'justify-start'} ${isLeft ? 'pr-8' : 'pl-8'} ml-${isLeft ? '0' : 'auto'} mr-${isLeft ? 'auto' : '0'}`}>
                      <div className={`w-5/12 ${isLeft ? 'text-right pr-8' : 'text-left pl-8'}`}>
                        <div className="mb-2 text-sm font-medium text-gray-500">{item.월}</div>
                        <div className={`text-4xl font-bold ${activeTab === 'sales' ? 'text-blue-600' : 'text-green-600'} mb-1`}>
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.건수}건 · 평균 {formatCurrency(Math.round(amount / item.건수))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 계약 데이터 테이블 */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">계약 상세 내역</h2>
          <p className="text-sm text-gray-500 mt-1">
            전체 {filteredContracts.length}건
            {totalPages > 1 && ` (페이지 ${currentPage} / ${totalPages})`}
          </p>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">고객명</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">차량</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">캐피탈</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">매체</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">총수수료</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">정산금액</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">계약일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    계약 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => {
                  // contractor 필드가 있으면 사용, 없으면 user_id로 찾기
                  const displayName = contract.contractor || users.find(u => u.id === contract.user_id)?.name || '미지정'
                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedContract(contract)
                        setIsContractModalOpen(true)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{contract.customer_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{contract.vehicle_name}</div>
                        <div className="text-xs text-gray-500">{contract.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{contract.capital}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{contract.media || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{displayName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(contract.total_commission)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(contract.settlement_amount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {contract.contract_date ? new Date(contract.contract_date).toLocaleDateString('ko-KR') : '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return <span key={page} className="text-gray-400">...</span>
              }
              return null
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {isContractModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">계약 상세 정보</h2>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* 고객 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  고객 정보
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">고객명</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedContract.customer_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">담당자</label>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedContract.contractor || users.find(u => u.id === selectedContract.user_id)?.name || '미지정'}
                      </p>
                    </div>
                  </div>

                  {/* 고객 서류 */}
                  {selectedContract.customer_documents && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">고객 서류</label>
                      {(() => {
                        try {
                          const files = JSON.parse(selectedContract.customer_documents)
                          const fileArray = Array.isArray(files) ? files : [selectedContract.customer_documents]
                          return (
                            <div className="space-y-2">
                              {fileArray.map((fileUrl, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="flex-1 text-sm text-gray-700">고객 서류 {index + 1}</span>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-all"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    다운로드
                                  </a>
                                </div>
                              ))}
                            </div>
                          )
                        } catch {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="flex-1 text-sm text-gray-700">고객 서류</span>
                              <a
                                href={selectedContract.customer_documents}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-all"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                다운로드
                              </a>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* 차량 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  차량 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">차량명</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.vehicle_name}</p>
                  </div>
                </div>
              </div>

              {/* 계약 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  계약 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">캐피탈</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.capital}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">계약유형</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.product_type || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">출고유형</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.delivery_type || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">매체</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.media || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">대리점</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedContract.dealership || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedContract.status)}`}>
                      {getStatusLabel(selectedContract.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">계약일</label>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedContract.contract_date ? new Date(selectedContract.contract_date).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">출고일</label>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedContract.execution_date ? new Date(selectedContract.execution_date).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 수수료 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  수수료 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">AG 수수료</label>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.ag_commission)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">캐피탈 수수료</label>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.capital_commission)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">딜러 수수료</label>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.dealer_commission)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">페이백</label>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.payback)}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-500 mb-1">총 수수료</label>
                    <p className="text-lg text-blue-600 font-bold">{formatCurrency(selectedContract.total_commission)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">정산 금액</label>
                    <p className="text-lg text-green-600 font-bold">{formatCurrency(selectedContract.settlement_amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
