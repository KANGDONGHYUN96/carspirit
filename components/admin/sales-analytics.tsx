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
    <div className="space-y-6">
      {/* 헤더와 필터 통합 섹션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* 타이틀과 새로 만들기 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">계약관리</h2>
          </div>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
            새로 만들기
          </button>
        </div>

        {/* 네비게이션 탭 */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          <button className="px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            표
          </button>
          <button className="px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            보드
          </button>
          <button className="px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            캘린더
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sales'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-transparent'
            }`}
          >
            매출 차트
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settlement'
                ? 'text-green-600 border-green-600'
                : 'text-gray-500 hover:text-gray-700 border-transparent'
            }`}
          >
            정산금 차트
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            최근 7일
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            월별
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            연도별
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
        </div>

        {/* 세부 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 연도 선택 */}
          {(selectedPeriod === 'year' || selectedPeriod === 'month') && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">연도</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
          )}

          {/* 월 선택 */}
          {selectedPeriod === 'month' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">월</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          )}

          {/* 영업자 선택 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">영업자</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 메인 타임라인 섹션 - 매출 또는 정산금 */}
      {monthlyTrendData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">
              {activeTab === 'sales' ? '매출 타임라인' : '정산금 타임라인'}
            </h3>
          </div>

          {/* 타임라인 */}
          <div className="relative">
            {/* 중앙 세로선 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>

            {/* 타임라인 아이템들 */}
            <div className="space-y-12">
              {monthlyTrendData.map((item, index) => {
                const amount = activeTab === 'sales' ? item.매출 : item.정산금
                const isLeft = index % 2 === 0

                return (
                  <div key={item.월} className="relative">
                    {/* 중앙 도트 */}
                    <div className="absolute left-1/2 top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 transform -translate-x-1/2 z-10"></div>

                    {/* 컨텐츠 */}
                    <div className={`flex ${isLeft ? 'justify-end' : 'justify-start'} ${isLeft ? 'pr-8' : 'pl-8'} ml-${isLeft ? '0' : 'auto'} mr-${isLeft ? 'auto' : '0'}`}>
                      <div className={`w-5/12 ${isLeft ? 'text-right pr-8' : 'text-left pl-8'}`}>
                        <div className={`bg-gradient-to-br ${activeTab === 'sales' ? 'from-blue-50 to-blue-100' : 'from-green-50 to-green-100'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">{item.월}</span>
                            <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">{item.건수}건</span>
                          </div>
                          <div className={`text-3xl font-bold ${activeTab === 'sales' ? 'text-blue-600' : 'text-green-600'} mb-1`}>
                            {formatCurrency(amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            평균: {formatCurrency(Math.round(amount / item.건수))}
                          </div>
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
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">계약 상세 내역</h3>
          <p className="text-sm text-gray-500 mt-1">
            전체 {filteredContracts.length}건
            {totalPages > 1 && ` (페이지 ${currentPage} / ${totalPages})`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">고객명</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">차량</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">캐피탈</th>
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    계약 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => {
                  // contractor 필드가 있으면 사용, 없으면 user_id로 찾기
                  const displayName = contract.contractor || users.find(u => u.id === contract.user_id)?.name || '미지정'
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
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
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            <div className="flex items-center gap-2">
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
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
