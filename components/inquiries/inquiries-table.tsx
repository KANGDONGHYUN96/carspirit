'use client'

import { useState, useEffect } from 'react'
import { Inquiry } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import InquiryDetailModal from './inquiry-detail-modal'
import AddInquiryModal from './add-inquiry-modal'

interface InquiriesTableProps {
  inquiries: Inquiry[]
  userId: string
  userName: string
  userRole: string
}

type FilterStatus = 'all' | '신규' | '관리' | '부재' | '심사' | '가망' | '계약'

export default function InquiriesTable({ inquiries, userId, userName, userRole }: InquiriesTableProps) {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [memoCounts, setMemoCounts] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  const supabase = createClient()

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

  // 공개 시간 표시 (7일전, 1시간전 등)
  const getUnlockTimeDisplay = (inquiry: Inquiry) => {
    const now = new Date()
    let unlockAt: Date

    // 잠금된 문의인 경우 unlock_at 사용
    if (inquiry.locked_at && inquiry.unlock_at) {
      unlockAt = new Date(inquiry.unlock_at)
    } else {
      // 신규 문의인 경우 created_at 기준으로 7일 후 계산
      const createdAt = new Date(inquiry.created_at)
      unlockAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    // 이미 공개됨
    if (now >= unlockAt) {
      return '오픈'
    }

    // 남은 시간 계산
    const diffMs = unlockAt.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays}일 후 공개`
    } else if (diffHours > 0) {
      return `${diffHours}시간 후 공개`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분 후 공개`
    } else {
      return '곧 공개'
    }
  }

  // 필터링
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesFilter = filter === 'all' || inquiry.status === filter
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

  // 상태별 카운트
  const counts = {
    all: inquiries.length,
    신규: inquiries.filter(i => i.status === '신규').length,
    관리: inquiries.filter(i => i.status === '관리').length,
    부재: inquiries.filter(i => i.status === '부재').length,
    심사: inquiries.filter(i => i.status === '심사').length,
    가망: inquiries.filter(i => i.status === '가망').length,
    계약: inquiries.filter(i => i.status === '계약').length,
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

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
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
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* 필터 및 검색 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
            {/* 신규 추가 버튼 */}
            <div className="ml-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                신규 고객 추가
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* 상태 필터 */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                전체 ({counts.all})
              </button>
              <button
                onClick={() => setFilter('신규')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '신규'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                신규 ({counts.신규})
              </button>
              <button
                onClick={() => setFilter('관리')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '관리'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                관리 ({counts.관리})
              </button>
              <button
                onClick={() => setFilter('부재')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '부재'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                부재 ({counts.부재})
              </button>
              <button
                onClick={() => setFilter('심사')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '심사'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                심사 ({counts.심사})
              </button>
              <button
                onClick={() => setFilter('가망')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '가망'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                가망 ({counts.가망})
              </button>
              <button
                onClick={() => setFilter('계약')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '계약'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                계약 ({counts.계약})
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
            <p className="text-gray-500 text-lg font-medium">문의가 없습니다</p>
            <p className="text-gray-500 text-sm mt-1">새로운 문의가 들어오면 여기에 표시됩니다</p>
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
                {currentInquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className={`hover:bg-gray-100 transition-all duration-300 cursor-pointer ${getRowBackgroundColor(inquiry.updated_at)}`}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">카스피릿</div>
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
                      <div className="text-sm text-gray-600">{inquiry.customer_phone || '-'}</div>
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
                      <div className="text-sm text-gray-600">
                        {getUnlockTimeDisplay(inquiry)}
                      </div>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedInquiry(inquiry)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
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
      </div>

      {/* 상세 모달 */}
      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          userId={userId}
          userName={userName}
          userRole={userRole}
        />
      )}

      {/* 신규 추가 모달 */}
      {showAddModal && (
        <AddInquiryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            window.location.reload()
          }}
          userId={userId}
          userName={userName}
        />
      )}
    </>
  )
}
