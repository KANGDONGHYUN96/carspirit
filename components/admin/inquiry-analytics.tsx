'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts'
import Image from 'next/image'

interface Inquiry {
  id: string
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  content: string
  status: string
  assigned_to: string | null
  assigned_to_name: string | null
  memo: string | null
  source: string | null
  created_at: string
  updated_at: string
  unlock_at: string | null
}

interface User {
  id: string
  name: string
  role: string
}

interface InquiryAnalyticsProps {
  inquiries: Inquiry[]
  users: User[]
}

// 플랫폼 매핑 정보
const PLATFORM_CONFIG: Record<string, { name: string; logo: string; color: string }> = {
  'blog': { name: '네이버블로그', logo: '/icon/blog.png', color: '#03C75A' },
  '네이버블로그': { name: '네이버블로그', logo: '/icon/blog.png', color: '#03C75A' },
  'instagram': { name: '인스타그램', logo: '/icon/instagram.png', color: '#E4405F' },
  '인스타그램': { name: '인스타그램', logo: '/icon/instagram.png', color: '#E4405F' },
  'facebook': { name: '페이스북', logo: '/icon/facebook.png', color: '#1877F2' },
  '페이스북': { name: '페이스북', logo: '/icon/facebook.png', color: '#1877F2' },
  'sumgo': { name: '숨고', logo: '/icon/sumgo.png', color: '#FF6B35' },
  '숨고': { name: '숨고', logo: '/icon/sumgo.png', color: '#FF6B35' },
  'kakao': { name: '오픈채팅', logo: '/icon/kakao.png', color: '#FEE500' },
  '오픈채팅': { name: '오픈채팅', logo: '/icon/kakao.png', color: '#FEE500' },
  'youtube': { name: '유튜브', logo: '/icon/youtube.png', color: '#FF0000' },
  '유튜브': { name: '유튜브', logo: '/icon/youtube.png', color: '#FF0000' },
}

// 기본 플랫폼 설정 (카스피릿 - 직접문의)
const DEFAULT_PLATFORM = { name: '카스피릿', logo: '/carspirit-logo.png', color: '#374151' }

// 플랫폼 정보 가져오기
function getPlatformConfig(source: string | null) {
  if (!source) return DEFAULT_PLATFORM
  const normalized = source.toLowerCase().trim()
  return PLATFORM_CONFIG[normalized] || PLATFORM_CONFIG[source] || DEFAULT_PLATFORM
}

// 태블로 스타일 컬러 팔레트
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

// 계약 상태로 간주되는 값들
const CONTRACT_STATUSES = ['계약', '출고', '정산대기', '완료']

export default function InquiryAnalytics({ inquiries: initialInquiries, users }: InquiryAnalyticsProps) {
  const [inquiries] = useState(initialInquiries)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month' | 'week'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  // 기간별 필터링
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const date = new Date(inquiry.created_at)

      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
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
  }, [inquiries, selectedPeriod, selectedYear, selectedMonth])

  // 이전 기간 데이터 (비교용)
  const previousPeriodInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const date = new Date(inquiry.created_at)

      switch (selectedPeriod) {
        case 'month':
          const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
          const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
          return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth
        case 'year':
          return date.getFullYear() === selectedYear - 1
        case 'week':
          const twoWeeksAgo = new Date()
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          return date >= twoWeeksAgo && date < oneWeekAgo
        case 'all':
        default:
          return false
      }
    })
  }, [inquiries, selectedPeriod, selectedYear, selectedMonth])

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredInquiries.length
    const prevTotal = previousPeriodInquiries.length

    // 상태별 카운트
    const byStatus: Record<string, number> = {}
    filteredInquiries.forEach(inquiry => {
      const status = inquiry.status || '미분류'
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    // 부재 건수
    const noAnswerCount = byStatus['부재'] || 0
    const noAnswerRate = total > 0 ? (noAnswerCount / total) * 100 : 0

    // 계약 건수 (계약, 출고, 정산대기, 완료)
    const contractCount = CONTRACT_STATUSES.reduce((sum, status) => sum + (byStatus[status] || 0), 0)
    const contractRate = total > 0 ? (contractCount / total) * 100 : 0

    // 응답률 (신규가 아닌 것)
    const newCount = byStatus['신규'] || 0
    const respondedCount = total - newCount
    const responseRate = total > 0 ? (respondedCount / total) * 100 : 0

    // 매체별 통계
    const bySource: Record<string, { count: number; contracted: number; noAnswer: number }> = {}
    filteredInquiries.forEach(inquiry => {
      const platform = getPlatformConfig(inquiry.source)
      const key = platform.name
      if (!bySource[key]) {
        bySource[key] = { count: 0, contracted: 0, noAnswer: 0 }
      }
      bySource[key].count++
      if (CONTRACT_STATUSES.includes(inquiry.status)) {
        bySource[key].contracted++
      }
      if (inquiry.status === '부재') {
        bySource[key].noAnswer++
      }
    })

    // 영업자별 통계
    const bySalesperson: Record<string, { count: number; contracted: number; noAnswer: number }> = {}
    filteredInquiries.forEach(inquiry => {
      const name = inquiry.assigned_to_name || users.find(u => u.id === inquiry.user_id)?.name || '미지정'
      if (!bySalesperson[name]) {
        bySalesperson[name] = { count: 0, contracted: 0, noAnswer: 0 }
      }
      bySalesperson[name].count++
      if (CONTRACT_STATUSES.includes(inquiry.status)) {
        bySalesperson[name].contracted++
      }
      if (inquiry.status === '부재') {
        bySalesperson[name].noAnswer++
      }
    })

    // 일별 추이 (최근 30일)
    const dailyTrend: Record<string, { count: number; contracted: number }> = {}
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    filteredInquiries.forEach(inquiry => {
      const date = new Date(inquiry.created_at)
      if (date >= last30Days) {
        const dateKey = date.toISOString().split('T')[0]
        if (!dailyTrend[dateKey]) {
          dailyTrend[dateKey] = { count: 0, contracted: 0 }
        }
        dailyTrend[dateKey].count++
        if (CONTRACT_STATUSES.includes(inquiry.status)) {
          dailyTrend[dateKey].contracted++
        }
      }
    })

    // 요일별 분포
    const byDayOfWeek: Record<number, number> = {}
    filteredInquiries.forEach(inquiry => {
      const day = new Date(inquiry.created_at).getDay()
      byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1
    })

    // 성장률
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0

    return {
      total,
      prevTotal,
      growth,
      noAnswerCount,
      noAnswerRate,
      contractCount,
      contractRate,
      responseRate,
      byStatus,
      bySource,
      bySalesperson,
      dailyTrend,
      byDayOfWeek
    }
  }, [filteredInquiries, previousPeriodInquiries, users])

  // 매체별 도넛 차트 데이터
  const sourceDonutData = useMemo(() => {
    return Object.entries(stats.bySource)
      .map(([name, data]) => ({
        name,
        value: data.count,
        contractRate: data.count > 0 ? ((data.contracted / data.count) * 100).toFixed(1) : '0',
        color: Object.values(PLATFORM_CONFIG).find(p => p.name === name)?.color || DEFAULT_PLATFORM.color
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats.bySource])

  // 상태별 도넛 차트 데이터
  const statusDonutData = useMemo(() => {
    const statusColors: Record<string, string> = {
      '신규': COLORS.primary,
      '관리': COLORS.secondary,
      '부재': COLORS.warning,
      '심사': COLORS.purple,
      '가망': COLORS.teal,
      '계약': COLORS.indigo,
      '출고': '#4CAF50',
      '정산대기': '#FF9800',
      '완료': '#2196F3',
    }

    return Object.entries(stats.byStatus)
      .map(([name, count]) => ({
        name,
        value: count,
        color: statusColors[name] || '#9E9E9E'
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats.byStatus])

  // 일별 추이 차트 데이터
  const dailyTrendData = useMemo(() => {
    return Object.entries(stats.dailyTrend)
      .map(([date, data]) => ({
        date: date.slice(5), // MM-DD 형식
        문의수: data.count,
        계약수: data.contracted
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [stats.dailyTrend])

  // 요일별 차트 데이터
  const dayOfWeekData = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days.map((day, i) => ({
      day,
      문의수: stats.byDayOfWeek[i] || 0
    }))
  }, [stats.byDayOfWeek])

  // 영업자별 막대 차트 데이터
  const salespersonData = useMemo(() => {
    return Object.entries(stats.bySalesperson)
      .map(([name, data]) => ({
        name,
        문의수: data.count,
        계약수: data.contracted,
        부재수: data.noAnswer,
        계약률: data.count > 0 ? ((data.contracted / data.count) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.문의수 - a.문의수)
      .slice(0, 10)
  }, [stats.bySalesperson])

  // 연도 목록
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">기간:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">최근 7일</option>
              <option value="month">월별</option>
              <option value="year">연도별</option>
              <option value="all">전체</option>
            </select>
          </div>

          {(selectedPeriod === 'month' || selectedPeriod === 'year') && (
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
          )}

          {selectedPeriod === 'month' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}월</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 문의 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">총 문의</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          {stats.growth !== 0 && (
            <div className={`mt-3 flex items-center text-sm ${stats.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{stats.growth > 0 ? '▲' : '▼'} {Math.abs(stats.growth).toFixed(1)}%</span>
              <span className="text-gray-500 ml-2">전기간 대비</span>
            </div>
          )}
        </div>

        {/* 계약률 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">계약률</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.contractRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {stats.contractCount}건 / {stats.total}건
          </p>
        </div>

        {/* 부재율 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">부재율</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.noAnswerRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {stats.noAnswerCount}건 / {stats.total}건
          </p>
        </div>

        {/* 응답률 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">응답률</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.responseRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            신규 제외 처리건
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매체별 문의 분포 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">매체별 문의 분포</h3>
          <div className="flex items-center gap-8">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                  >
                    {sourceDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}건`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {sourceDonutData.map((item, index) => {
                const platformConfig = Object.values(PLATFORM_CONFIG).find(p => p.name === item.name)
                const logo = platformConfig?.logo || DEFAULT_PLATFORM.logo
                const isCarspirit = item.name === '카스피릿'
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 relative flex-shrink-0 flex items-center justify-center ${isCarspirit ? 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-md p-0.5' : ''}`}>
                        <Image
                          src={logo}
                          alt={item.name}
                          width={isCarspirit ? 18 : 24}
                          height={isCarspirit ? 18 : 24}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{item.value}건</span>
                      <span className="text-xs text-gray-500 ml-2">({item.contractRate}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 상태별 분포 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">상태별 분포</h3>
          <div className="flex items-center gap-8">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}건`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {statusDonutData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{item.value}건</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 일별 추이 */}
      {dailyTrendData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">일별 문의 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="문의수" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="계약수" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
              <span className="text-sm text-gray-600">문의수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
              <span className="text-sm text-gray-600">계약수</span>
            </div>
          </div>
        </div>
      )}

      {/* 영업자별 성과 */}
      {salespersonData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">영업자별 성과</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salespersonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="문의수" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              <Bar dataKey="계약수" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
              <span className="text-sm text-gray-600">문의수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
              <span className="text-sm text-gray-600">계약수</span>
            </div>
          </div>
        </div>
      )}

      {/* 요일별 분포 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">요일별 문의 분포</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dayOfWeekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="문의수" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 매체별 상세 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">매체별 상세 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">매체</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">문의수</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">계약수</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">계약률</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">부재수</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">부재율</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([name, data], index) => {
                  const platformConfig = Object.values(PLATFORM_CONFIG).find(p => p.name === name)
                  const logo = platformConfig?.logo || DEFAULT_PLATFORM.logo
                  const contractRate = data.count > 0 ? ((data.contracted / data.count) * 100).toFixed(1) : '0'
                  const noAnswerRate = data.count > 0 ? ((data.noAnswer / data.count) * 100).toFixed(1) : '0'
                  const isCarspirit = name === '카스피릿'

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 relative flex-shrink-0 flex items-center justify-center ${isCarspirit ? 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-md p-0.5' : ''}`}>
                            <Image
                              src={logo}
                              alt={name}
                              width={isCarspirit ? 18 : 24}
                              height={isCarspirit ? 18 : 24}
                              className="object-contain"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-bold text-gray-900">{data.count}</td>
                      <td className="text-right py-3 px-4 text-sm text-green-600 font-medium">{data.contracted}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`text-sm font-medium ${Number(contractRate) >= 20 ? 'text-green-600' : Number(contractRate) >= 10 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {contractRate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-yellow-600 font-medium">{data.noAnswer}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`text-sm font-medium ${Number(noAnswerRate) >= 30 ? 'text-red-600' : Number(noAnswerRate) >= 15 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {noAnswerRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
