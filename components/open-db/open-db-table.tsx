'use client'

import { useState, useEffect } from 'react'
import { Inquiry } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import OpenDBDetailModal from './open-db-detail-modal'

interface OpenDBTableProps {
  inquiries: Inquiry[]
  userId: string
  userName: string
  userRole: string
  todayLockCount: number
}

type FilterDays = 'all' | '3' | '7' | '14' | '30'

export default function OpenDBTable({ inquiries, userId, userName, userRole, todayLockCount }: OpenDBTableProps) {
  const [filter, setFilter] = useState<FilterDays>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [memoCounts, setMemoCounts] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  const supabase = createClient()

  const isAdmin = userRole === 'admin'

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

  // 경과일 계산
  const getDaysSinceUpdate = (updatedAt: string) => {
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  // 필터링 (경과일 기준)
  const filteredInquiries = inquiries.filter((inquiry) => {
    const days = getDaysSinceUpdate(inquiry.updated_at)
    let matchesFilter = true

    if (filter === '3') {
      matchesFilter = days >= 3 && days < 7
    } else if (filter === '7') {
      matchesFilter = days >= 7 && days < 14
    } else if (filter === '14') {
      matchesFilter = days >= 14 && days < 30
    } else if (filter === '30') {
      matchesFilter = days >= 30
    }

    const matchesSearch =
      inquiry.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // 페이지네이션
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInquiries = filteredInquiries.slice(startIndex, endIndex)

  // 필터나 검색이 변경되면 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // 경과일별 카운트
  const counts = {
    all: inquiries.length,
    '3': inquiries.filter(i => { const d = getDaysSinceUpdate(i.updated_at); return d >= 3 && d < 7 }).length,
    '7': inquiries.filter(i => { const d = getDaysSinceUpdate(i.updated_at); return d >= 7 && d < 14 }).length,
    '14': inquiries.filter(i => { const d = getDaysSinceUpdate(i.updated_at); return d >= 14 && d < 30 }).length,
    '30': inquiries.filter(i => getDaysSinceUpdate(i.updated_at) >= 30).length,
  }

  // 전화번호 마스킹
  const maskPhone = (phone: string | null) => {
    if (!phone) return '-'
    // 010-1234-5678 -> 010-****-****
    const parts = phone.split('-')
    if (parts.length === 3) {
      return `${parts[0]}-****-****`
    }
    return phone
  }

  // 남은 시간 계산
  const getTimeRemaining = (inquiry: Inquiry) => {
    const createdAt = new Date(inquiry.created_at)
    const now = new Date()
    const sevenDaysLater = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    const msRemaining = sevenDaysLater.getTime() - now.getTime()

    if (msRemaining <= 0) return '공개됨'

    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}일 ${hours}시간 후 공개`
    if (hours > 0) return `${hours}시간 ${minutes}분 후 공개`
    return `${minutes}분 후 공개`
  }

  // 상태 표시
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '신규':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">신규</span>
      case '관리':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">관리</span>
      case '부재':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">부재</span>
      case '심사':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">심사</span>
      case '가망':
        return <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm font-medium rounded-full">가망</span>
      case '계약':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">계약</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">{status}</span>
    }
  }

  // 수정일자 기준 경과일수에 따른 배경색
  const getRowBackgroundColor = (updatedAt: string) => {
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays >= 30) return 'bg-purple-50'
    if (diffDays >= 14) return 'bg-red-50'
    if (diffDays >= 7) return 'bg-orange-50'
    if (diffDays >= 3) return 'bg-yellow-50'
    return ''
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* 필터 및 검색 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* 경과일 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('3')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === '3'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              3일
            </button>
            <button
              onClick={() => setFilter('7')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === '7'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
              }`}
            >
              7일
            </button>
            <button
              onClick={() => setFilter('14')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === '14'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              14일
            </button>
            <button
              onClick={() => setFilter('30')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === '30'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              30일
            </button>
          </div>

          {/* 검색 */}
          <input
            type="text"
            placeholder="고객명, 전화번호, 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 결과 요약 */}
      {filteredInquiries.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-sm text-gray-600">
              전체 <span className="font-semibold text-gray-900">{filteredInquiries.length}</span>개 중
              <span className="font-semibold text-gray-900"> {startIndex + 1}-{Math.min(endIndex, filteredInquiries.length)}</span>개 표시
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>3일</span>
                <div className="w-4 h-4 bg-yellow-300 border border-gray-300 rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>7일</span>
                <div className="w-4 h-4 bg-orange-300 border border-gray-300 rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>14일</span>
                <div className="w-4 h-4 bg-red-300 border border-gray-300 rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>30일</span>
                <div className="w-4 h-4 bg-purple-300 border border-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 테이블 */}
      {filteredInquiries.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">오픈DB에 문의가 없습니다</p>
          <p className="text-gray-500 text-sm mt-1">7일이 지난 문의가 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">매체</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">문의일자</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">고객명</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">번호</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">문의내용</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">수정일자</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">공개상태</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">메모</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentInquiries.map((inquiry) => {
                // unlock_at으로 잠금 상태 확인
                const now = new Date()
                const isLocked = inquiry.unlock_at && now < new Date(inquiry.unlock_at)
                const isMyLock = inquiry.locked_by === userId

                return (
                  <tr
                    key={inquiry.id}
                    className={`hover:bg-gray-100 transition-all duration-300 cursor-pointer ${getRowBackgroundColor(inquiry.updated_at)}`}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{inquiry.source || '카스피릿'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{inquiry.assigned_to_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(inquiry.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(inquiry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{inquiry.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{maskPhone(inquiry.customer_phone)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">{inquiry.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(inquiry.updated_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isLocked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">🔒</span>
                          <span className="text-sm text-red-600 font-medium">
                            {isMyLock ? '내가 잠금' : '잠금됨'}
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">오픈</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {memoCounts[inquiry.id] ? (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {memoCounts[inquiry.id]}개
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-medium text-sm">
                        상세보기
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {filteredInquiries.length > 0 && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              이전
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number

                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white shadow-sm'
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
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              다음
            </button>
          </div>

          <div className="text-sm text-gray-600">
            페이지 <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedInquiry && (
        <OpenDBDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          userId={userId}
          userName={userName}
          userRole={userRole}
          todayLockCount={todayLockCount}
        />
      )}
    </div>
  )
}
