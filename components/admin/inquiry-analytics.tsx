'use client'

import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar } from 'recharts'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import InquiryDetailModal from '@/components/inquiries/inquiry-detail-modal'

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
  marketing_agreed: boolean | null
}

interface User {
  id: string
  name: string
  role: string
  approved: boolean
}

interface InquiryAnalyticsProps {
  inquiries: Inquiry[]
  users: User[]
  currentUserId: string
  currentUserName: string
  currentUserRole: string
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

// 계약 상태로 간주되는 값들
const CONTRACT_STATUSES = ['계약', '출고', '정산대기', '완료']

// 원형 프로그레스 컴포넌트
function CircularProgress({ value, size = 120, strokeWidth = 10, color, label, subLabel }: {
  value: number
  size?: number
  strokeWidth?: number
  color: string
  label: string
  subLabel?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{value.toFixed(1)}%</span>
        <span className="text-xs text-gray-500 mt-1">{label}</span>
        {subLabel && <span className="text-xs text-gray-400">{subLabel}</span>}
      </div>
    </div>
  )
}

// 순위 뱃지 컴포넌트
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">🥇</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">🥈</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">🥉</span>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-500 font-bold text-sm">{rank}</span>
    </div>
  )
}

export default function InquiryAnalytics({ inquiries: initialInquiries, users, currentUserId, currentUserName, currentUserRole }: InquiryAnalyticsProps) {
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month' | 'week'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  // 테이블 관련 state
  const [currentPage, setCurrentPage] = useState(1)
  const [memoCounts, setMemoCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [marketingFilter, setMarketingFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const itemsPerPage = 20
  const supabase = createClient()

  // 매체 목록 (필터용) - 순서 지정
  const SOURCE_ORDER = ['카스피릿', '페이스북', '인스타그램', '유튜브', '카카오', '숨고', '네이버블로그']

  const sourceOptions = useMemo(() => {
    const sources = new Set<string>()
    inquiries.forEach(inq => {
      const platform = getPlatformConfig(inq.source)
      sources.add(platform.name)
    })
    // 지정된 순서대로 정렬, 없는 것은 맨 뒤로
    return Array.from(sources).sort((a, b) => {
      const indexA = SOURCE_ORDER.indexOf(a)
      const indexB = SOURCE_ORDER.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }, [inquiries])

  // 승인된 사용자만 필터링 (담당자 변경용)
  const approvedUsers = useMemo(() => users.filter(u => u.approved), [users])

  // 메모 개수 가져오기
  useEffect(() => {
    async function fetchMemoCounts() {
      const inquiryIds = inquiries.map(i => i.id)
      if (inquiryIds.length === 0) return

      const { data } = await supabase
        .from('inquiry_memos')
        .select('inquiry_id')
        .in('inquiry_id', inquiryIds)

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach(memo => {
          counts[memo.inquiry_id] = (counts[memo.inquiry_id] || 0) + 1
        })
        setMemoCounts(counts)
      }
    }

    fetchMemoCounts()
  }, [inquiries])

  // 담당자 변경 함수
  const handleAssigneeChange = async (inquiryId: string, newUserId: string) => {
    const selectedUser = approvedUsers.find(u => u.id === newUserId)
    if (!selectedUser) return

    const { error } = await supabase
      .from('inquiries')
      .update({
        user_id: newUserId,
        assigned_to: newUserId,
        assigned_to_name: selectedUser.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiryId)

    if (!error) {
      setInquiries(prev => prev.map(inq =>
        inq.id === inquiryId
          ? { ...inq, user_id: newUserId, assigned_to: newUserId, assigned_to_name: selectedUser.name }
          : inq
      ))
    }
  }

  // 상태 뱃지
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      '신규': 'bg-blue-100 text-blue-700',
      '관리': 'bg-green-100 text-green-700',
      '부재': 'bg-yellow-100 text-yellow-700',
      '심사': 'bg-orange-100 text-orange-700',
      '가망': 'bg-cyan-100 text-cyan-700',
      '계약': 'bg-purple-100 text-purple-700',
      '출고': 'bg-emerald-100 text-emerald-700',
      '정산대기': 'bg-amber-100 text-amber-700',
      '완료': 'bg-sky-100 text-sky-700',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    )
  }

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
        contracted: data.contracted,
        contractRate: data.count > 0 ? ((data.contracted / data.count) * 100).toFixed(1) : '0',
        color: Object.values(PLATFORM_CONFIG).find(p => p.name === name)?.color || DEFAULT_PLATFORM.color
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats.bySource])

  // 상태별 도넛 차트 데이터
  const statusDonutData = useMemo(() => {
    const statusColors: Record<string, string> = {
      '신규': '#3B82F6',
      '관리': '#10B981',
      '부재': '#F59E0B',
      '심사': '#8B5CF6',
      '가망': '#06B6D4',
      '계약': '#6366F1',
      '출고': '#22C55E',
      '정산대기': '#F97316',
      '완료': '#0EA5E9',
    }

    return Object.entries(stats.byStatus)
      .map(([name, count]) => ({
        name,
        value: count,
        color: statusColors[name] || '#9CA3AF'
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats.byStatus])

  // 일별 추이 차트 데이터
  const dailyTrendData = useMemo(() => {
    return Object.entries(stats.dailyTrend)
      .map(([date, data]) => ({
        date: date.slice(5),
        문의수: data.count,
        계약수: data.contracted
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [stats.dailyTrend])

  // 요일별 차트 데이터
  const dayOfWeekData = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const maxValue = Math.max(...Object.values(stats.byDayOfWeek), 1)
    return days.map((day, i) => ({
      day,
      문의수: stats.byDayOfWeek[i] || 0,
      fill: i === 0 || i === 6 ? '#F87171' : '#3B82F6',
      percentage: ((stats.byDayOfWeek[i] || 0) / maxValue) * 100
    }))
  }, [stats.byDayOfWeek])

  // 영업자별 데이터
  const salespersonData = useMemo(() => {
    return Object.entries(stats.bySalesperson)
      .map(([name, data]) => ({
        name,
        문의수: data.count,
        계약수: data.contracted,
        부재수: data.noAnswer,
        계약률: data.count > 0 ? ((data.contracted / data.count) * 100) : 0
      }))
      .sort((a, b) => b.문의수 - a.문의수)
      .slice(0, 10)
  }, [stats.bySalesperson])

  // 테이블용 필터링 (검색 + 매체 + 마케팅 필터 적용)
  const tableInquiries = useMemo(() => {
    return filteredInquiries.filter(inquiry => {
      // 검색 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          inquiry.customer_name.toLowerCase().includes(query) ||
          inquiry.customer_phone?.toLowerCase().includes(query) ||
          inquiry.content.toLowerCase().includes(query) ||
          inquiry.assigned_to_name?.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }

      // 매체 필터
      if (sourceFilter !== 'all') {
        const platform = getPlatformConfig(inquiry.source)
        if (platform.name !== sourceFilter) return false
      }

      // 마케팅 동의 필터
      if (marketingFilter !== 'all') {
        if (marketingFilter === 'yes' && !inquiry.marketing_agreed) return false
        if (marketingFilter === 'no' && inquiry.marketing_agreed) return false
      }

      return true
    })
  }, [filteredInquiries, searchQuery, sourceFilter, marketingFilter])

  // 페이지네이션
  const totalPages = Math.ceil(tableInquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentTableInquiries = tableInquiries.slice(startIndex, startIndex + itemsPerPage)

  // 검색이나 필터 변경시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedPeriod, selectedYear, selectedMonth, sourceFilter, marketingFilter])

  // 연도 목록
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  // 최대 매체 문의수
  const maxSourceCount = Math.max(...sourceDonutData.map(s => s.value), 1)

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">분석 기간</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: 'week', label: '7일' },
                { value: 'month', label: '월별' },
                { value: 'year', label: '연간' },
                { value: 'all', label: '전체' }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setSelectedPeriod(item.value as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === item.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {(selectedPeriod === 'month' || selectedPeriod === 'year') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 bg-gray-100 border-0 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          )}

          {selectedPeriod === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 bg-gray-100 border-0 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}월</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 핵심 지표 - 대형 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 총 문의 - 히어로 카드 */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <p className="text-blue-100 text-sm font-medium mb-1">총 문의</p>
            <p className="text-5xl font-bold mb-2">{stats.total.toLocaleString()}</p>
            <p className="text-blue-200 text-sm">건</p>
            {stats.growth !== 0 && (
              <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                stats.growth > 0 ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
              }`}>
                {stats.growth > 0 ? '↑' : '↓'} {Math.abs(stats.growth).toFixed(1)}%
                <span className="text-blue-200 ml-1">전기간 대비</span>
              </div>
            )}
          </div>
        </div>

        {/* 핵심 지표 원형 차트들 */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-4">
          {/* 계약률 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.contractRate}
              color="#10B981"
              label="계약률"
              subLabel={`${stats.contractCount}/${stats.total}건`}
            />
          </div>

          {/* 응답률 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.responseRate}
              color="#3B82F6"
              label="응답률"
              subLabel="신규 제외"
            />
          </div>

          {/* 부재율 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
            <CircularProgress
              value={stats.noAnswerRate}
              color="#F59E0B"
              label="부재율"
              subLabel={`${stats.noAnswerCount}/${stats.total}건`}
            />
          </div>
        </div>
      </div>

      {/* 매체별 성과 - 인포그래픽 스타일 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          매체별 성과 분석
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 도넛 차트 */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {sourceDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value}건 (계약 ${props.payload.contracted}건)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 매체별 프로그레스 바 */}
          <div className="space-y-4">
            {sourceDonutData.map((item, index) => {
              const platformConfig = Object.values(PLATFORM_CONFIG).find(p => p.name === item.name)
              const logo = platformConfig?.logo || DEFAULT_PLATFORM.logo
              const isCarspirit = item.name === '카스피릿'
              const percentage = (item.value / maxSourceCount) * 100

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <RankBadge rank={index + 1} />
                      <div className={`w-8 h-8 relative flex items-center justify-center ${isCarspirit ? 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-1' : ''}`}>
                        <Image
                          src={logo}
                          alt={item.name}
                          width={isCarspirit ? 22 : 28}
                          height={isCarspirit ? 22 : 28}
                          className="object-contain"
                        />
                      </div>
                      <span className="font-semibold text-gray-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{item.value}건</span>
                      <span className="text-sm text-gray-500 ml-2">계약 {item.contracted}건</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                        boxShadow: `0 0 10px ${item.color}40`
                      }}
                    />
                    {/* 계약률 표시 */}
                    <div
                      className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                      style={{ width: `${(Number(item.contractRate) / 100) * percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>계약률 {item.contractRate}%</span>
                    <span>{((item.value / stats.total) * 100).toFixed(1)}% 점유</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 상태별 분포 - 가로 바 차트 스타일 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-gradient-to-b from-green-500 to-teal-500 rounded-full" />
          문의 상태 분포
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusDonutData.map((item, index) => {
            const percentage = stats.total > 0 ? (item.value / stats.total) * 100 : 0
            return (
              <div
                key={index}
                className="relative p-4 rounded-xl border-2 transition-all hover:shadow-lg"
                style={{ borderColor: `${item.color}40` }}
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-10"
                  style={{ backgroundColor: item.color }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-600">{item.name}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-gray-500">({percentage.toFixed(1)}%)</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 일별 추이 - 에어리어 차트 스타일 */}
      {dailyTrendData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full" />
            일별 문의 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrendData}>
              <defs>
                <linearGradient id="colorInquiry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorContract" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="문의수"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3B82F6' }}
                activeDot={{ r: 6, fill: '#3B82F6' }}
              />
              <Line
                type="monotone"
                dataKey="계약수"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981' }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-600">문의수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-600">계약수</span>
            </div>
          </div>
        </div>
      )}

      {/* 영업자 & 요일별 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 영업자별 성과 - 랭킹 스타일 */}
        {salespersonData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              영업자별 성과 랭킹
            </h3>
            <div className="space-y-3">
              {salespersonData.map((person, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    index < 3 ? 'bg-gradient-to-r from-gray-50 to-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <RankBadge rank={index + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{person.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>문의 {person.문의수}건</span>
                      <span>계약 {person.계약수}건</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      person.계약률 >= 20 ? 'text-green-600' :
                      person.계약률 >= 10 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {person.계약률.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">계약률</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 요일별 분포 - 인포그래픽 바 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
            요일별 문의 패턴
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {dayOfWeekData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-12 rounded-t-xl transition-all duration-500"
                    style={{
                      height: `${Math.max(day.percentage * 1.5, 20)}px`,
                      backgroundColor: day.fill,
                      opacity: 0.8
                    }}
                  />
                  <span className="absolute -top-6 text-sm font-bold text-gray-700">
                    {day.문의수}
                  </span>
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  index === 0 || index === 6 ? 'text-red-500' : 'text-gray-600'
                }`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">평일</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-gray-600">주말</span>
            </div>
          </div>
        </div>
      </div>

      {/* 문의 상세 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full" />
              문의 상세 목록
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({tableInquiries.length}건)
              </span>
            </h3>
            <input
              type="text"
              placeholder="고객명, 연락처, 내용, 담당자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
            />
          </div>

          {/* 필터 영역 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 매체 필터 - 로고만 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSourceFilter('all')}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                  sourceFilter === 'all'
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="전체"
              >
                <span className="text-xs font-bold">All</span>
              </button>
              {sourceOptions.map(source => {
                const config = Object.values(PLATFORM_CONFIG).find(p => p.name === source) || DEFAULT_PLATFORM
                const isCarspirit = source === '카스피릿'
                return (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                      sourceFilter === source
                        ? 'ring-2 ring-offset-1'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } ${isCarspirit && sourceFilter === source ? 'bg-gray-800' : ''}`}
                    style={sourceFilter === source ? { ['--tw-ring-color' as string]: config.color } : {}}
                    title={source}
                  >
                    <div className={`w-6 h-6 relative flex items-center justify-center ${isCarspirit ? 'bg-gray-800 rounded p-0.5' : ''}`}>
                      <Image
                        src={config.logo}
                        alt={source}
                        width={isCarspirit ? 16 : 22}
                        height={isCarspirit ? 16 : 22}
                        className="object-contain"
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 마케팅 동의 필터 - 오른쪽 배치 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMarketingFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  marketingFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setMarketingFilter('yes')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  marketingFilter === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                동의 O
              </button>
              <button
                onClick={() => setMarketingFilter('no')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  marketingFilter === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                동의 X
              </button>
            </div>
          </div>
        </div>

        {tableInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">매체</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">담당자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">문의일자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">고객명</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">문의내용</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">수정일자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">메모</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">마케팅</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTableInquiries.map((inquiry) => {
                    const platform = getPlatformConfig(inquiry.source)
                    const isCarspirit = platform.name === '카스피릿'

                    return (
                      <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                        {/* 매체 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 relative flex items-center justify-center ${isCarspirit ? 'bg-gray-800 rounded p-0.5' : ''}`}>
                              <Image
                                src={platform.logo}
                                alt={platform.name}
                                width={isCarspirit ? 16 : 20}
                                height={isCarspirit ? 16 : 20}
                                className="object-contain"
                              />
                            </div>
                            <span className="text-sm text-gray-700">{platform.name}</span>
                          </div>
                        </td>

                        {/* 담당자 (변경 가능) */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={inquiry.assigned_to || inquiry.user_id || ''}
                            onChange={(e) => handleAssigneeChange(inquiry.id, e.target.value)}
                            className="text-sm bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:border-blue-500 focus:outline-none cursor-pointer hover:bg-gray-50"
                          >
                            <option value="">미지정</option>
                            {approvedUsers.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 문의일자 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </td>

                        {/* 상태 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(inquiry.status)}
                        </td>

                        {/* 고객명 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{inquiry.customer_name}</span>
                        </td>

                        {/* 번호 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{inquiry.customer_phone || '-'}</span>
                        </td>

                        {/* 문의내용 */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 line-clamp-1 max-w-[200px]" title={inquiry.content}>
                            {inquiry.content}
                          </span>
                        </td>

                        {/* 수정일자 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(inquiry.updated_at).toLocaleDateString('ko-KR', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </td>

                        {/* 메모 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {memoCounts[inquiry.id] ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {memoCounts[inquiry.id]}개
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* 마케팅 동의 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {inquiry.marketing_agreed ? (
                            <span className="text-green-600 font-bold">O</span>
                          ) : (
                            <span className="text-red-500 font-bold">X</span>
                          )}
                        </td>

                        {/* 액션 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    이전
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
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
                          className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    다음
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, tableInquiries.length)} / {tableInquiries.length}건
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 문의 상세 모달 */}
      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry as any}
          onClose={() => setSelectedInquiry(null)}
          userId={currentUserId}
          userName={currentUserName}
          userRole={currentUserRole}
        />
      )}
    </div>
  )
}
