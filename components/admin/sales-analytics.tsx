'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts'

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
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedContractor, setSelectedContractor] = useState<string>('all')

  // 담당자 목록 추출 (contractor 컬럼 기준)
  const contractorList = useMemo(() => {
    const contractors = new Set<string>()
    contracts.forEach(c => {
      if (c.contractor) contractors.add(c.contractor)
    })
    return Array.from(contractors).sort()
  }, [contracts])
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

    // 담당자(contractor) 기준 필터링
    if (selectedContractor !== 'all') {
      filtered = filtered.filter(c => c.contractor === selectedContractor)
    }

    filtered = filtered.filter(contract => {
      const date = new Date(contract.contract_date || contract.execution_date!)

      switch (selectedPeriod) {
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
  }, [contracts, selectedPeriod, selectedYear, selectedMonth, selectedContractor])

  // 이전 기간 데이터 (비교용)
  const previousPeriodContracts = useMemo(() => {
    let filtered = contracts.filter(c => c.contract_date || c.execution_date)

    if (selectedContractor !== 'all') {
      filtered = filtered.filter(c => c.contractor === selectedContractor)
    }

    filtered = filtered.filter(contract => {
      const date = new Date(contract.contract_date || contract.execution_date!)

      switch (selectedPeriod) {
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
  }, [contracts, selectedPeriod, selectedYear, selectedMonth, selectedContractor])

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


  // 상태별 도넛 차트 데이터
  const statusDonutData = useMemo(() => {
    const statusLabels: Record<string, string> = {
      contract: '계약',
      delivery: '출고',
      waiting: '정산대기',
      completed: '완료'
    }

    return Object.entries(stats.byStatus).map(([status, data]) => ({
      name: statusLabels[status] || status,
      value: data.count
    }))
  }, [stats.byStatus])

  // 매체별 유입 순위 도넛 차트 데이터 (계약률 포함)
  const mediaDonutData = useMemo(() => {
    const totalCount = filteredContracts.length
    const completedByMedia: Record<string, number> = {}

    // 완료된 계약 건수 계산
    filteredContracts.forEach(c => {
      const media = c.media || '직접영업'
      if (c.status === 'completed') {
        completedByMedia[media] = (completedByMedia[media] || 0) + 1
      }
    })

    return Object.entries(stats.byMedia)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([media, data]) => {
        const completed = completedByMedia[media] || 0
        const contractRate = data.count > 0 ? Math.round((completed / data.count) * 100) : 0
        return {
          name: media,
          value: data.count,
          percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
          contractRate
        }
      })
  }, [filteredContracts, stats.byMedia])

  // 연령대별 계약 데이터
  const ageGroupData = useMemo(() => {
    const ageGroups: Record<string, { count: number; completed: number }> = {
      '20대': { count: 0, completed: 0 },
      '30대': { count: 0, completed: 0 },
      '40대': { count: 0, completed: 0 },
      '50대': { count: 0, completed: 0 },
      '60대+': { count: 0, completed: 0 },
    }

    const currentYear = new Date().getFullYear()

    filteredContracts.forEach(contract => {
      if (contract.birth_date) {
        const birthYear = parseInt(contract.birth_date.split('-')[0])
        const age = currentYear - birthYear
        let group = '60대+'

        if (age < 30) group = '20대'
        else if (age < 40) group = '30대'
        else if (age < 50) group = '40대'
        else if (age < 60) group = '50대'

        ageGroups[group].count++
        if (contract.status === 'completed') {
          ageGroups[group].completed++
        }
      }
    })

    const totalCount = filteredContracts.length

    return Object.entries(ageGroups)
      .filter(([, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: data.count,
        percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
        contractRate: data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0
      }))
  }, [filteredContracts])

  // 도넛 차트 컬러 - 화이트 기반 모던 컬러 팔레트
  const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  const MEDIA_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']
  const AGE_COLORS = ['#06B6D4', '#6366F1', '#EC4899', '#84CC16', '#F97316']

  // 1년치 월별 매출 데이터 (필터 연동)
  const yearlyMonthlyData = useMemo(() => {
    const targetYear = selectedYear
    const monthlyData: Record<string, number> = {}

    // 12개월 초기화
    for (let i = 1; i <= 12; i++) {
      monthlyData[`${targetYear}년 ${i}월`] = 0
    }

    // 담당자 필터를 적용한 계약에서 선택된 연도 데이터만 집계
    let filtered = contracts.filter(c => c.contract_date || c.execution_date)

    if (selectedContractor !== 'all') {
      filtered = filtered.filter(c => c.contractor === selectedContractor)
    }

    filtered.forEach(contract => {
      const date = new Date(contract.contract_date || contract.execution_date!)
      if (date.getFullYear() === targetYear) {
        const monthKey = `${targetYear}년 ${date.getMonth() + 1}월`
        monthlyData[monthKey] += contract.total_commission || 0
      }
    })

    // formatCurrency 인라인 함수
    const fmtCurrency = (amount: number) => {
      if (amount >= 100000000) {
        const billions = Math.floor(amount / 100000000)
        const remainder = Math.floor((amount % 100000000) / 10000)
        if (remainder > 0) {
          return `${billions}억 ${remainder.toLocaleString()}만`
        }
        return `${billions}억`
      }
      if (amount >= 10000) {
        return `${Math.floor(amount / 10000).toLocaleString()}만`
      }
      return amount.toLocaleString()
    }

    return Object.entries(monthlyData).map(([name, value]) => ({
      name,
      value,
      displayValue: fmtCurrency(value)
    }))
  }, [contracts, selectedYear, selectedContractor])

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      const billions = Math.floor(amount / 100000000)
      const remainder = Math.floor((amount % 100000000) / 10000)
      if (remainder > 0) {
        return `${billions}억 ${remainder.toLocaleString()}만`
      }
      return `${billions}억`
    }
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000).toLocaleString()}만`
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
      // editFormData에서 값이 있으면 사용, 없으면 selectedContract 기존값 유지
      const payload = {
        status: editFormData.status || selectedContract.status,
        settlement_amount: editFormData.settlement_amount ? parseInt(editFormData.settlement_amount) : (selectedContract.settlement_amount || 0),
        execution_date: editFormData.execution_date || selectedContract.execution_date || null,
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
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 - Linear 스타일 */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-8 lg:px-12 py-4">
          <div className="flex items-center gap-6">
            {/* 기간 필터 - 미니멀 */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              {[
                { key: 'all', label: '전체' },
                { key: 'month', label: '월별' },
                { key: 'year', label: '연도' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as 'all' | 'month' | 'year')}
                  className={`px-3 py-1.5 text-xs font-normal rounded-md transition-colors ${
                    selectedPeriod === period.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* 연도/월 선택 */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>

            {selectedPeriod === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            )}

            {/* 담당자 필터 */}
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="all">전체 담당자</option>
              {contractorList.map(contractor => (
                <option key={contractor} value={contractor}>{contractor}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="px-8 lg:px-12 py-10">
        {/* 연간 월별 매출 차트 - 상단 배치 */}
        <div className="border border-gray-200 rounded-xl p-8 mb-12">
          <h3 className="text-sm font-normal text-gray-900 mb-6">{selectedYear}년 월별 매출</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyMonthlyData} margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value.replace(/\d+년 /, '')}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₩${formatCurrency(value)}`}
                />
                <Tooltip
                  formatter={(value: number) => [`₩${formatCurrency(value)}`, '매출']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList
                    dataKey="displayValue"
                    position="top"
                    fill="#6B7280"
                    fontSize={10}
                    formatter={(value) => (value && value !== '0') ? `₩${value}` : ''}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 카드 3개 - 미니멀 border 스타일 */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {/* 총 매출 */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-400 uppercase tracking-wide">총 매출</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalCommission)}</p>
            <p className="text-xs text-gray-400 mt-2">{formatFullCurrency(stats.totalCommission)}</p>
          </div>

          {/* 계약 건수 */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-400 uppercase tracking-wide">계약 건수</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalContracts}<span className="text-base font-normal text-gray-400 ml-1">건</span></p>
            <p className="text-xs text-gray-400 mt-2">완료 {stats.completedContracts}건</p>
          </div>

          {/* 증감률 */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs text-gray-400 uppercase tracking-wide">전월 대비</span>
            </div>
            <p className={`text-2xl font-semibold ${stats.commissionGrowth >= 0 ? 'text-gray-900' : 'text-gray-900'}`}>
              {stats.commissionGrowth >= 0 ? '+' : ''}{stats.commissionGrowth.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-2">매출 증감률</p>
          </div>
        </div>

        {/* 계약상태 + 매체별 유입 + 연령대별 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* 상태 요약 - 도넛형 */}
          <div className="border border-gray-200 rounded-xl p-8">
            <h3 className="text-sm font-normal text-gray-900 mb-6">계약 상태</h3>
            <div className="flex items-center gap-8">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDonutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {statusDonutData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></div>
                      <span className="text-sm text-gray-500">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}건</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 매체별 유입 순위 - 도넛형 (계약률 포함) */}
          <div className="border border-gray-200 rounded-xl p-8">
            <h3 className="text-sm font-normal text-gray-900 mb-6">매체별 유입 순위</h3>
            <div className="flex items-center gap-8">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mediaDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mediaDonutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={MEDIA_COLORS[index % MEDIA_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {mediaDonutData.length > 0 ? (
                  mediaDonutData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MEDIA_COLORS[index % MEDIA_COLORS.length] }}></div>
                        <span className="text-sm text-gray-500">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{item.value}건</span>
                        <span className="text-xs text-gray-400">({item.percentage}%)</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">계약률 {item.contractRate}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">매체 데이터 없음</p>
                )}
              </div>
            </div>
          </div>

          {/* 연령대별 계약 - 도넛형 (계약률 포함) */}
          <div className="border border-gray-200 rounded-xl p-8">
            <h3 className="text-sm font-normal text-gray-900 mb-6">연령대별 계약</h3>
            <div className="flex items-center gap-8">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageGroupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {ageGroupData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {ageGroupData.length > 0 ? (
                  ageGroupData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AGE_COLORS[index % AGE_COLORS.length] }}></div>
                        <span className="text-sm text-gray-500">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{item.value}건</span>
                        <span className="text-xs text-gray-400">({item.percentage}%)</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600">계약률 {item.contractRate}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">생년월일 데이터 없음</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 계약 목록 테이블 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-normal text-gray-900">계약 목록</h3>
            <span className="text-xs text-gray-400">{filteredContracts.length}건</span>
          </div>

          <div className="overflow-x-auto">
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
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">매체</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">고객명</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">번호</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">상태</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">담당자</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">금융사</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">판매구분</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">차량명</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">차량가</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">총수수료</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">정산금액</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">계약일</th>
                  <th className="px-3 py-4 text-left text-xs font-normal text-gray-400 tracking-wide">출고일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-8 py-16 text-center">
                      <p className="text-sm text-gray-400">데이터가 없습니다</p>
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((contract) => {
                    const displayName = contract.contractor || users.find(u => u.id === contract.user_id)?.name || '-'
                    return (
                      <tr
                        key={contract.id}
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedContract(contract)
                          setEditFormData({
                            status: contract.status || '',
                            ag_commission: contract.ag_commission ? String(contract.ag_commission) : '',
                            capital_commission: contract.capital_commission ? String(contract.capital_commission) : '',
                            dealer_commission: contract.dealer_commission ? String(contract.dealer_commission) : '',
                            payback: contract.payback ? String(contract.payback) : '',
                            total_commission: contract.total_commission ? String(contract.total_commission) : '',
                            settlement_amount: contract.settlement_amount ? String(contract.settlement_amount) : '',
                            contract_date: contract.contract_date || '',
                            execution_date: contract.execution_date || '',
                          })
                          setIsEditMode(false)
                          setIsContractModalOpen(true)
                        }}
                      >
                        <td className="px-3 py-4">
                          <span className="px-2 py-1 text-xs rounded-lg font-medium bg-gray-900 text-white truncate block">
                            {contract.media || '카스피릿'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm font-semibold text-gray-900 truncate">{contract.customer_name}</td>
                        <td className="px-3 py-4 text-sm text-gray-600 truncate">{contract.phone || '-'}</td>
                        <td className="px-3 py-4">
                          <span className={`inline-block px-2 py-0.5 text-xs font-normal rounded border ${getStatusColor(contract.status)}`}>
                            {getStatusLabel(contract.status)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600 truncate">{displayName}</td>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredContracts.length)} / {filteredContracts.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
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
                      className={`w-7 h-7 text-xs rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Contract Detail Modal - 미니멀 스타일 */}
      {isContractModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-800">계약 상세</h2>
              <button
                type="button"
                onClick={() => {
                  setIsContractModalOpen(false)
                  setIsEditMode(false)
                }}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/50 hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center py-2.5 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 bg-green-50">
                <div className="flex items-center gap-2 w-40">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-600 font-medium">정산금액</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={isEditMode ? editFormData.settlement_amount : (selectedContract.settlement_amount ? String(selectedContract.settlement_amount) : '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setEditFormData({ ...editFormData, settlement_amount: value })
                      setIsEditMode(true)
                    }}
                    placeholder="정산금액 입력"
                    className="w-48 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-green-600 focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder:text-gray-400 placeholder:font-normal"
                  />
                  {(isEditMode ? editFormData.settlement_amount : selectedContract.settlement_amount) && (
                    <span className="ml-2 text-sm text-green-600">
                      ₩{formatNumber(isEditMode ? editFormData.settlement_amount : String(selectedContract.settlement_amount || ''))}
                    </span>
                  )}
                </div>
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

              {/* 버튼 영역 - 글래스 */}
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-white/20">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      className="px-6 py-2.5 bg-white/50 hover:bg-white/70 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-300"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveContract}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg"
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
