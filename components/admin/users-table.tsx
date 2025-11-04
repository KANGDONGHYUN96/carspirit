'use client'

import { useState } from 'react'
import { User } from '@/types/database.types'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

interface UsersTableProps {
  users: User[]
  currentUserId: string
}

type FilterStatus = 'all' | 'pending' | 'approved'
type FilterRole = 'all' | 'admin' | 'manager' | 'salesperson'

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editedPhone, setEditedPhone] = useState('')
  const [editedMemo, setEditedMemo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const itemsPerPage = 50

  console.log('UsersTable received users:', users)
  console.log('Users length:', users.length)

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !user.approved) ||
      (filterStatus === 'approved' && user.approved)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesRole && matchesSearch
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // 필터 변경 시 첫 페이지로 이동
  const handleFilterChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  // 상태별 카운트
  const counts = {
    all: users.length,
    pending: users.filter(u => !u.approved).length,
    approved: users.filter(u => u.approved).length,
  }

  // 역할별 카운트
  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    salesperson: users.filter(u => u.role === 'salesperson').length,
  }

  // 상태 라벨
  const getStatusLabel = (approved: boolean) => {
    return approved ? '승인됨' : '대기중'
  }

  // 역할 라벨
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자'
      case 'manager':
        return '매니저'
      case 'salesperson':
        return '영업자'
      default:
        return role
    }
  }

  // 상태 변경
  const handleApproval = async (userId: string, approve: boolean) => {
    setIsUpdating(userId)

    try {
      const response = await fetch('/api/admin/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved: approve })
      })

      if (!response.ok) {
        throw new Error('상태 변경 실패')
      }

      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      setAlert({ message: '상태 변경에 실패했습니다.', type: 'error' })
    } finally {
      setIsUpdating(null)
    }
  }

  // 역할 변경
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'manager' | 'salesperson') => {
    setConfirm({
      message: `역할을 ${getRoleLabel(newRole)}(으)로 변경하시겠습니까?`,
      onConfirm: async () => {
        setConfirm(null)
        setIsUpdating(userId)

        try {
          const response = await fetch('/api/admin/users/role', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole })
          })

          if (!response.ok) {
            throw new Error('역할 변경 실패')
          }

          // 페이지 새로고침
          window.location.reload()
        } catch (error) {
          console.error('역할 변경 실패:', error)
          setAlert({ message: '역할 변경에 실패했습니다.', type: 'error' })
        } finally {
          setIsUpdating(null)
        }
      }
    })
  }

  // 사용자 상세 모달 열기
  const handleOpenUserModal = (user: User) => {
    setSelectedUser(user)
    setEditedPhone(user.phone || '')
    setEditedMemo(user.admin_memo || '')
    setIsUserModalOpen(true)
  }

  // 사용자 정보 저장
  const handleSaveUserInfo = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          phone: editedPhone,
          admin_memo: editedMemo
        })
      })

      if (!response.ok) {
        throw new Error('사용자 정보 업데이트 실패')
      }

      setAlert({ message: '사용자 정보가 업데이트되었습니다.', type: 'success' })
      setIsUserModalOpen(false)

      // 페이지 새로고침
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error)
      setAlert({ message: '사용자 정보 업데이트에 실패했습니다.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300">
      {/* 필터 섹션 */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* 상태 필터 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">승인 상태</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange(() => setFilterStatus('all'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              전체 ({counts.all})
            </button>
            <button
              onClick={() => handleFilterChange(() => setFilterStatus('pending'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              대기중 ({counts.pending})
            </button>
            <button
              onClick={() => handleFilterChange(() => setFilterStatus('approved'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'approved'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              승인됨 ({counts.approved})
            </button>
          </div>
        </div>

        {/* 역할 필터 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">역할</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange(() => setFilterRole('all'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterRole === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              전체 ({roleCounts.all})
            </button>
            <button
              onClick={() => handleFilterChange(() => setFilterRole('admin'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterRole === 'admin'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              관리자 ({roleCounts.admin})
            </button>
            <button
              onClick={() => handleFilterChange(() => setFilterRole('manager'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterRole === 'manager'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              매니저 ({roleCounts.manager})
            </button>
            <button
              onClick={() => handleFilterChange(() => setFilterRole('salesperson'))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterRole === 'salesperson'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              영업자 ({roleCounts.salesperson})
            </button>
          </div>
        </div>

        {/* 검색 */}
        <input
          type="text"
          placeholder="이름, 이메일, 전화번호 검색..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full sm:w-80 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </div>

      {/* 결과 요약 */}
      {filteredUsers.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            전체 <span className="font-semibold text-gray-900">{filteredUsers.length}</span>명
            {totalPages > 1 && (
              <span className="ml-2 text-gray-500">
                (페이지 {currentPage} / {totalPages})
              </span>
            )}
          </p>
        </div>
      )}

      {/* 테이블 */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">사용자가 없습니다</p>
          <p className="text-gray-500 text-sm mt-1">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">전화번호</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">역할</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isProcessing = isUpdating === user.id

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleOpenUserModal(user)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-blue-600 font-semibold">(나)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isCurrentUser ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-cyan-100 text-cyan-700'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'manager' | 'salesperson')}
                          disabled={isProcessing}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="admin">관리자</option>
                          <option value="manager">매니저</option>
                          <option value="salesperson">영업자</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getStatusLabel(user.approved)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!isCurrentUser && !user.approved && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproval(user.id, true)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? '처리중...' : '승인'}
                          </button>
                        </div>
                      )}
                      {!isCurrentUser && user.approved && (
                        <button
                          onClick={() => handleApproval(user.id, false)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '처리중...' : '승인취소'}
                        </button>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs text-gray-400">본인</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
              // 현재 페이지 주변만 표시
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

      {/* Custom Alert Modal */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />

      {/* Custom Confirm Modal */}
      <CustomConfirm
        isOpen={confirm !== null}
        message={confirm?.message || ''}
        onConfirm={() => {
          if (confirm?.onConfirm) {
            confirm.onConfirm()
          }
        }}
        onCancel={() => setConfirm(null)}
        type="info"
      />

      {/* User Detail Modal */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">사용자 상세 정보</h2>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    selectedUser.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-cyan-100 text-cyan-700'
                  }`}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="전화번호를 입력하세요"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Business Card */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">명함</label>
                {selectedUser.business_card_url ? (
                  <div className="space-y-3">
                    <div className="relative bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <img
                        src={selectedUser.business_card_url}
                        alt="명함"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                      />
                    </div>
                    <a
                      href={selectedUser.business_card_url}
                      download={`명함_${selectedUser.name}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      다운로드
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">명함이 등록되지 않았습니다</p>
                  </div>
                )}
              </div>

              {/* Admin Memo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 메모
                  <span className="ml-2 text-xs text-gray-500">(사용자에게 보이지 않음)</span>
                </label>
                <textarea
                  value={editedMemo}
                  onChange={(e) => setEditedMemo(e.target.value)}
                  placeholder="관리자 전용 메모를 입력하세요..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedUser.approved ? '승인됨' : '대기중'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">가입일</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setIsUserModalOpen(false)}
                disabled={isSaving}
                className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleSaveUserInfo}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
