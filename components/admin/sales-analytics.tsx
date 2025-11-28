'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'

interface Contract {
  id: string
  user_id: string | null
  contractor: string | null
  customer_name: string
  phone: string | null
  funding_same: boolean | null
  funding_name: string | null
  funding_phone: string | null
  birth_date: string | null
  special_notes: string | null
  vehicle_name: string
  vehicle_options: string | null
  vehicle_color: string | null
  vehicle_price: number | null
  brand: string
  capital: string
  contract_type: string
  status: string
  sales_type: string | null
  contract_period: string | null
  annual_mileage: string | null
  initial_cost_type: string | null
  initial_cost_amount: string | null
  insurance_age: string | null
  car_tax_included: string | null
  customer_support: string | null
  contract_route: string | null
  finance_company: string | null
  dealer_name: string | null
  manufacturer_dealer: string | null
  ag_commission: number
  finance_commission: number | null
  capital_commission: number
  dealer_commission: number
  other_commission: number | null
  customer_support_amount: number | null
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

// 태블로 화이트 스타일 컬러 팔레트
const COLORS = {
  primary: '#1E88E5',
  secondary: '#43A047',
  warning: '#FB8C00',
  danger: '#E53935',
  purple: '#8E24AA',
  teal: '#00897B',
  indigo: '#3949AB',
  pink: '#D81B60'
}

export default function SalesAnalytics({ contracts: initialContracts, users }: SalesAnalyticsProps) {
  const [contracts, setContracts] = useState(initialContracts)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month' | 'week'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    status: string
    ag_commission: string
    capital_commission: string
    dealer_commission: string
    payback: string
    total_commission: string
    settlement_amount: string
    contract_date: string
    execution_date: string
  }>({
    status: '',
    ag_commission: '',
    capital_commission: '',
    dealer_commission: '',
    payback: '',
    total_commission: '',
    settlement_amount: '',
    contract_date: '',
    execution_date: '',
  })
  const itemsPerPage = 15

  // 기간별 필터링
  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter(c => c.contract_date || c.execution_date)

    if (selectedUser !== 'all') {
      filtered = filtered.filter(c => c.user_id === selectedUser)
    }

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

  // 이전 기간 데이터 (비교용)
  const previousPeriodContracts = useMemo(() => {
    let filtered = contracts.filter(c => c.contract_date || c.execution_date)

    if (selectedUser !== 'all') {
      filtered = filtered.filter(c => c.user_id === selectedUser)
    }

    const now = new Date()
    filtered = filtered.filter(contract => {
      const date = new Date(contract.contract_date || contract.execution_date!)

      switch (selectedPeriod) {
        case 'week':
          const twoWeeksAgo = new Date(now)
          twoWeeksAgo.setDate(now.getDate() - 14)
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return date >= twoWeeksAgo && date < weekAgo
        case 'month':
          const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
          const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
          return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth
        case 'year':
          return date.getFullYear() === selectedYear - 1
        case 'all':
        default:
          return false
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
    const totalVehiclePrice = filteredContracts.reduce((sum, c) => sum + (c.vehicle_price || 0), 0)
    const avgCommission = totalContracts > 0 ? totalCommission / totalContracts : 0
    const avgVehiclePrice = totalContracts > 0 ? totalVehiclePrice / totalContracts : 0

    // 이전 기간 통계
    const prevTotalCommission = previousPeriodContracts.reduce((sum, c) => sum + (c.total_commission || 0), 0)
    const prevTotalSettlement = previousPeriodContracts.reduce((sum, c) => sum + (c.settlement_amount || 0), 0)
    const prevTotalContracts = previousPeriodContracts.length

    // 성장률 계산
    const commissionGrowth = prevTotalCommission > 0 ? ((totalCommission - prevTotalCommission) / prevTotalCommission) * 100 : 0
    const settlementGrowth = prevTotalSettlement > 0 ? ((totalSettlement - prevTotalSettlement) / prevTotalSettlement) * 100 : 0
    const contractGrowth = prevTotalContracts > 0 ? ((totalContracts - prevTotalContracts) / prevTotalContracts) * 100 : 0

    // 마진율 계산
    const marginRate = totalCommission > 0 ? (totalSettlement / totalCommission) * 100 : 0

    // 캐피탈별 통계
    const byCapital = filteredContracts.reduce((acc, contract) => {
      const capital = contract.capital || '기타'
      if (!acc[capital]) {
        acc[capital] = { count: 0, commission: 0, settlement: 0 }
      }
      acc[capital].count++
      acc[capital].commission += contract.total_commission || 0
      acc[capital].settlement += contract.settlement_amount || 0
      return acc
    }, {} as Record<string, { count: number; commission: number; settlement: number }>)

    // 영업자별 통계
    const bySalesperson = filteredContracts.reduce((acc, contract) => {
      const name = contract.contractor || users.find(u => u.id === contract.user_id)?.name || '미지정'
      if (!acc[name]) {
        acc[name] = { count: 0, commission: 0, settlement: 0 }
      }
      acc[name].count++
      acc[name].commission += contract.total_commission || 0
      acc[name].settlement += contract.settlement_amount || 0
      return acc
    }, {} as Record<string, { count: number; commission: number; settlement: number }>)

    // 매체별 통계
    const byMedia = filteredContracts.reduce((acc, contract) => {
      const media = contract.media || '직접영업'
      if (!acc[media]) {
        acc[media] = { count: 0, commission: 0 }
      }
      acc[media].count++
      acc[media].commission += contract.total_commission || 0
      return acc
    }, {} as Record<string, { count: number; commission: number }>)

    // 상품유형별 통계 (렌트/리스)
    const byProductType = filteredContracts.reduce((acc, contract) => {
      const type = contract.product_type || '기타'
      if (!acc[type]) {
        acc[type] = { count: 0, commission: 0 }
      }
      acc[type].count++
      acc[type].commission += contract.total_commission || 0
      return acc
    }, {} as Record<string, { count: number; commission: number }>)

    // 상태별 통계
    const byStatus = filteredContracts.reduce((acc, contract) => {
      const status = contract.status || '기타'
      if (!acc[status]) {
        acc[status] = { count: 0, commission: 0 }
      }
      acc[status].count++
      acc[status].commission += contract.total_commission || 0
      return acc
    }, {} as Record<string, { count: number; commission: number }>)

    // 월별 추이
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
      totalVehiclePrice,
      avgCommission,
      avgVehiclePrice,
      commissionGrowth,
      settlementGrowth,
      contractGrowth,
      marginRate,
      byCapital,
      bySalesperson,
      byMedia,
      byProductType,
      byStatus,
      monthlyTrend
    }
  }, [filteredContracts, previousPeriodContracts, users])

  // 차트 데이터 준비
  const capitalChartData = Object.entries(stats.byCapital)
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 6)
    .map(([name, data]) => ({
      name: name.length > 8 ? name.substring(0, 8) + '...' : name,
      fullName: name,
      매출: data.commission,
      정산: data.settlement,
      건수: data.count
    }))

  const salespersonChartData = Object.entries(stats.bySalesperson)
    .sort((a, b) => b[1].commission - a[1].commission)
    .map(([name, data]) => ({
      name,
      매출: data.commission,
      정산: data.settlement,
      건수: data.count
    }))

  const mediaChartData = Object.entries(stats.byMedia)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      value: data.count,
      commission: data.commission
    }))

  const productTypeData = Object.entries(stats.byProductType)
    .map(([name, data]) => ({
      name,
      value: data.count,
      commission: data.commission
    }))

  const monthlyTrendData = Object.entries(stats.monthlyTrend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      월: month.substring(5), // "2024-11" -> "11"
      매출: data.commission,
      정산: data.settlement,
      건수: data.count
    }))

  // 수익 구조 데이터
  const revenueStructureData = [
    { name: 'AG 수수료', value: stats.totalAGCommission, color: COLORS.primary },
    { name: '캐피탈 수수료', value: stats.totalCapitalCommission, color: COLORS.secondary },
    { name: '딜러 수수료', value: stats.totalDealerCommission, color: COLORS.warning },
    { name: '페이백', value: stats.totalPayback, color: COLORS.danger },
  ].filter(item => item.value > 0)

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`
    }
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}천만`
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`
    }
    return amount.toLocaleString()
  }

  const formatFullCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const strValue = String(value)
    const num = strValue.replace(/[^\d]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  const calculateTotalCommission = () => {
    const ag = parseInt(editFormData.ag_commission) || 0
    const capital = parseInt(editFormData.capital_commission) || 0
    const dealer = parseInt(editFormData.dealer_commission) || 0
    const payback = parseInt(editFormData.payback) || 0
    return ag + capital + dealer - payback
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
  }

  const handleSaveContract = async () => {
    if (!selectedContract) return

    setIsSaving(true)
    try {
      const payload = {
        status: editFormData.status,
        ag_commission: editFormData.ag_commission ? parseInt(editFormData.ag_commission) : 0,
        capital_commission: editFormData.capital_commission ? parseInt(editFormData.capital_commission) : 0,
        dealer_commission: editFormData.dealer_commission ? parseInt(editFormData.dealer_commission) : 0,
        payback: editFormData.payback ? parseInt(editFormData.payback) : 0,
        total_commission: calculateTotalCommission(),
        settlement_amount: editFormData.settlement_amount ? parseInt(editFormData.settlement_amount) : 0,
        contract_date: editFormData.contract_date || null,
        execution_date: editFormData.execution_date || null,
      }

      const response = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('저장 실패')
      }

      const updatedContracts = contracts.map(c =>
        c.id === selectedContract.id ? { ...c, ...payload } : c
      )
      setContracts(updatedContracts)
      setSelectedContract({ ...selectedContract, ...payload })
      setIsEditMode(false)
      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
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
      contract: 'bg-blue-50 text-blue-700 border-blue-200',
      delivery: 'bg-purple-50 text-purple-700 border-purple-200',
      waiting: 'bg-amber-50 text-amber-700 border-amber-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return colorMap[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  // 페이지네이션
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage)
  const paginatedContracts = filteredContracts
    .sort((a, b) => new Date(b.contract_date || b.created_at).getTime() - new Date(a.contract_date || a.created_at).getTime())
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatFullCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 필터 헤더 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {/* 기간 필터 버튼 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'week', label: '7일' },
                { key: 'month', label: '월별' },
                { key: 'year', label: '연도' },
                { key: 'all', label: '전체' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === period.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* 연도/월 선택 */}
            {(selectedPeriod === 'year' || selectedPeriod === 'month') && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            )}

            {selectedPeriod === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            )}
          </div>

          {/* 영업자 필터 */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 영업자</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hero KPI 카드 - 4개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 총 매출 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">총 매출</span>
              <div className={`flex items-center gap-1 text-xs font-medium ${stats.commissionGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.commissionGrowth >= 0 ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(stats.commissionGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.totalCommission)}
            </div>
            <div className="text-sm text-gray-400">
              {formatFullCurrency(stats.totalCommission)}
            </div>
          </div>

          {/* 순이익 (정산금) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">순이익</span>
              <div className={`flex items-center gap-1 text-xs font-medium ${stats.settlementGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.settlementGrowth >= 0 ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(stats.settlementGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {formatCurrency(stats.totalSettlement)}
            </div>
            <div className="text-sm text-gray-400">
              마진율 {stats.marginRate.toFixed(1)}%
            </div>
          </div>

          {/* 계약 건수 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">계약 건수</span>
              <div className={`flex items-center gap-1 text-xs font-medium ${stats.contractGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.contractGrowth >= 0 ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(stats.contractGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalContracts}<span className="text-lg font-normal text-gray-400">건</span>
            </div>
            <div className="text-sm text-gray-400">
              완료 {stats.completedContracts}건
            </div>
          </div>

          {/* 평균 계약 단가 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">평균 계약 단가</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.avgCommission)}
            </div>
            <div className="text-sm text-gray-400">
              평균 차량가 {formatCurrency(stats.avgVehiclePrice)}
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 매출 추이 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">매출 추이</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSettlement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="월" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="매출" stroke={COLORS.primary} fill="url(#colorCommission)" strokeWidth={2} />
                  <Area type="monotone" dataKey="정산" stroke={COLORS.secondary} fill="url(#colorSettlement)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                <span className="text-sm text-gray-600">매출</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                <span className="text-sm text-gray-600">정산</span>
              </div>
            </div>
          </div>

          {/* 수익 구조 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">수익 구조</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueStructureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueStructureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatFullCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {revenueStructureData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 캐피탈별 매출 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">캐피탈별 매출</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capitalChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="매출" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 영업자별 실적 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">영업자별 실적</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salespersonChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="매출" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 보조 KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 매체별 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3">매체별 유입</h4>
            <div className="space-y-2">
              {mediaChartData.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}건</span>
                </div>
              ))}
            </div>
          </div>

          {/* 상품유형별 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3">상품유형</h4>
            <div className="space-y-2">
              {productTypeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}건</span>
                </div>
              ))}
            </div>
          </div>

          {/* AG 비용 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3">AG 비용</h4>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.totalAGCommission)}
            </div>
            <div className="text-sm text-gray-400">
              비율 {stats.totalCommission > 0 ? ((stats.totalAGCommission / stats.totalCommission) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* 페이백 비용 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3">페이백 비용</h4>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {formatCurrency(stats.totalPayback)}
            </div>
            <div className="text-sm text-gray-400">
              비율 {stats.totalCommission > 0 ? ((stats.totalPayback / stats.totalCommission) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* 계약 상세 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">계약 상세</h3>
              <span className="text-sm text-gray-500">총 {filteredContracts.length}건</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캐피탈</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매출</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">정산</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계약일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">해당 기간에 계약 데이터가 없습니다</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((contract) => {
                    const displayName = contract.contractor || users.find(u => u.id === contract.user_id)?.name || '미지정'
                    return (
                      <tr
                        key={contract.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedContract(contract)
                          setIsContractModalOpen(true)
                        }}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{contract.customer_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{contract.vehicle_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{contract.capital}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{displayName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(contract.status)}`}>
                            {getStatusLabel(contract.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">{formatFullCurrency(contract.total_commission)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-emerald-600">{formatFullCurrency(contract.settlement_amount)}</span>
                        </td>
                        <td className="px-6 py-4">
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
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredContracts.length)} / {filteredContracts.length}건
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract Detail Modal - 노션 스타일 (계약관리 페이지와 동일) */}
      {isContractModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-200 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">계약 상세 정보</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsContractModalOpen(false)
                  setIsEditMode(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* 계약자명 (상단 크게) */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedContract.funding_same === false ? (selectedContract.funding_name || selectedContract.customer_name) : selectedContract.customer_name}
                </h1>
                {selectedContract.funding_same === false && selectedContract.funding_name && (
                  <p className="text-sm text-gray-500 mt-1">문의자: {selectedContract.customer_name} {selectedContract.phone}</p>
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
                        setEditFormData({ ...editFormData, status: item.value })
                        setIsEditMode(true)
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                        (isEditMode ? editFormData.status : selectedContract.status) === item.value ? item.bgActive : item.bgInactive
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
                <span className="flex-1"><span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-900 text-white">{selectedContract.media || '카스피릿'}</span></span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-gray-500">담당자</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.contractor || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">문의자</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.customer_name || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-500">문의자 연락처</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.phone || '-'}</span>
              </div>
              {selectedContract.funding_same === false && (
                <>
                  <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                    <div className="flex items-center gap-2 w-40">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-500">계약자</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-900">{selectedContract.funding_name || '-'}</span>
                  </div>
                  <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                    <div className="flex items-center gap-2 w-40">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm text-gray-500">계약자 연락처</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-900">{selectedContract.funding_phone || '-'}</span>
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
                <span className="flex-1 text-sm text-gray-900">{selectedContract.birth_date || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-sm text-gray-500">특이사항</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.special_notes || '-'}</span>
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
                <span className="flex-1 text-sm text-gray-900">{selectedContract.vehicle_name || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-sm text-gray-500">옵션</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.vehicle_options || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="text-sm text-gray-500">색상</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.vehicle_color || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">차량가</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.vehicle_price ? formatNumber(String(selectedContract.vehicle_price)) : '0'}</span>
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
                  {selectedContract.sales_type ? (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      selectedContract.sales_type === '렌트' ? 'bg-green-100 text-green-800' :
                      selectedContract.sales_type === '리스' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{selectedContract.sales_type}</span>
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
                <span className="flex-1 text-sm text-gray-900">{selectedContract.contract_period ? `${selectedContract.contract_period}개월` : '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm text-gray-500">연간주행거리</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.annual_mileage ? `${formatNumber(selectedContract.annual_mileage)}km` : '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">초기비용</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.initial_cost_type || '-'} {selectedContract.initial_cost_amount ? `(₩${formatNumber(selectedContract.initial_cost_amount)})` : ''}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm text-gray-500">보험연령</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.insurance_age || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">자동차세</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.car_tax_included || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">고객지원</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.customer_support || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">계약유형</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">{selectedContract.contract_type || '-'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm text-gray-500">계약경로</span>
                </div>
                <span className="flex-1">
                  {selectedContract.contract_route ? (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      selectedContract.contract_route === '특판' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>{selectedContract.contract_route}</span>
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
                <span className="flex-1 text-sm text-gray-900">{selectedContract.finance_company || '-'}</span>
              </div>
              {selectedContract.contract_route === '대리점' && (
                <>
                  <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                    <div className="flex items-center gap-2 w-40">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-sm text-gray-500">대리점명</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-900">{selectedContract.dealer_name || '-'}</span>
                  </div>
                  <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                    <div className="flex items-center gap-2 w-40">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-500">제조사 딜러</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-900">{selectedContract.manufacturer_dealer || '-'}</span>
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
                <span className="flex-1 text-sm text-gray-900">{selectedContract.contract_date || '-'}</span>
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
                    value={isEditMode ? editFormData.execution_date : (selectedContract.execution_date || '')}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, execution_date: e.target.value })
                      setIsEditMode(true)
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
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.ag_commission ? formatNumber(String(selectedContract.ag_commission)) : '0'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">금융사 수당</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.finance_commission ? formatNumber(String(selectedContract.finance_commission)) : '0'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm text-gray-500">대리점 수당</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.dealer_commission ? formatNumber(String(selectedContract.dealer_commission)) : '0'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-500">기타 수당</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.other_commission ? formatNumber(String(selectedContract.other_commission)) : '0'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">고객지원금</span>
                </div>
                <span className="flex-1 text-sm text-gray-900">₩{selectedContract.customer_support_amount ? formatNumber(String(selectedContract.customer_support_amount)) : '0'}</span>
              </div>
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 bg-blue-50">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-blue-600 font-medium">총 수수료</span>
                </div>
                <span className="flex-1 text-sm font-bold text-blue-600">₩{formatNumber(String(selectedContract.total_commission || 0))}</span>
              </div>

              {/* 고객서류 섹션 */}
              {selectedContract.customer_documents && (
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
                          const files = JSON.parse(selectedContract.customer_documents)
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
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveContract}
                      disabled={isSaving}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    닫기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
