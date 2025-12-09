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

// 은행 목록
const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
  'IBK기업은행', 'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크',
  '케이뱅크', '새마을금고', '신협', '우체국', '수협은행',
  'BNK부산은행', 'BNK경남은행', 'DGB대구은행', '광주은행', '전북은행', '제주은행'
]

// 사용자 상세 모달 컴포넌트
interface UserDetailModalProps {
  user: User
  editedPhone: string
  editedFax: string
  editedMemo: string
  editedCompany: string
  editedPosition: string
  editedJoinDate: string
  editedRecruiterNumber: string
  editedBankName: string
  editedAccountHolder: string
  editedAccountNumber: string
  setEditedPhone: (v: string) => void
  setEditedFax: (v: string) => void
  setEditedMemo: (v: string) => void
  setEditedCompany: (v: string) => void
  setEditedPosition: (v: string) => void
  setEditedJoinDate: (v: string) => void
  setEditedRecruiterNumber: (v: string) => void
  setEditedBankName: (v: string) => void
  setEditedAccountHolder: (v: string) => void
  setEditedAccountNumber: (v: string) => void
  isSaving: boolean
  onClose: () => void
  onSave: () => void
  getRoleLabel: (role: string) => string
}

function UserDetailModal({
  user,
  editedPhone, editedFax, editedMemo, editedCompany, editedPosition,
  editedJoinDate, editedRecruiterNumber, editedBankName, editedAccountHolder, editedAccountNumber,
  setEditedPhone, setEditedFax, setEditedMemo, setEditedCompany, setEditedPosition,
  setEditedJoinDate, setEditedRecruiterNumber, setEditedBankName, setEditedAccountHolder, setEditedAccountNumber,
  isSaving, onClose, onSave, getRoleLabel
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'contract' | 'account'>('personal')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">사용자 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - 2 Column Layout */}
        <div className="flex overflow-hidden" style={{ height: 'calc(90vh - 140px)' }}>
          {/* 좌측: Personal Information */}
          <div className="w-[320px] flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-gray-400 text-sm">General</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-semibold text-sm">Personal Information</span>
            </div>

            {/* 프로필 사진 */}
            <div className="flex flex-col items-center mb-6">
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg mb-4">
                  {user.name.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <p className="text-gray-500 text-sm">{getRoleLabel(user.role)}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-cyan-100 text-cyan-700'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {user.approved ? '승인됨' : '대기중'}
                </span>
              </div>
            </div>

            {/* 기본 정보 요약 */}
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
                <p className="text-gray-900 mt-1 text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Phone</label>
                <p className="text-gray-900 mt-1 text-sm">{editedPhone || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Company</label>
                <p className="text-gray-900 mt-1 text-sm">{editedCompany || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">가입일</label>
                <p className="text-gray-900 mt-1 text-sm">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 명함 미리보기 */}
            {user.business_card_url && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">명함</label>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <img
                    src={user.business_card_url}
                    alt="명함"
                    className="w-full rounded shadow-sm"
                  />
                </div>
                <a
                  href={user.business_card_url}
                  download={`명함_${user.name}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드
                </a>
              </div>
            )}
          </div>

          {/* 우측: 상세 정보 편집 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === 'personal' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  인적사항
                  {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                  onClick={() => setActiveTab('contract')}
                  className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === 'contract' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  회사/업무 정보
                  {activeTab === 'contract' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === 'account' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  정산계좌
                  {activeTab === 'account' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
              </div>

              <div className="p-6">
                {/* 인적사항 탭 */}
                {activeTab === 'personal' && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">이름</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                        {user.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">연락처</label>
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">이메일</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">팩스</label>
                      <input
                        type="text"
                        value={editedFax}
                        onChange={(e) => setEditedFax(e.target.value)}
                        placeholder="02-0000-0000"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* 회사/업무 정보 탭 */}
                {activeTab === 'contract' && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">소속</label>
                      <input
                        type="text"
                        value={editedCompany}
                        onChange={(e) => setEditedCompany(e.target.value)}
                        placeholder="회사/조직명"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">직급</label>
                      <input
                        type="text"
                        value={editedPosition}
                        onChange={(e) => setEditedPosition(e.target.value)}
                        placeholder="직급/직책"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">입사일</label>
                      <input
                        type="date"
                        value={editedJoinDate}
                        onChange={(e) => setEditedJoinDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">모집인 번호</label>
                      <input
                        type="text"
                        value={editedRecruiterNumber}
                        onChange={(e) => setEditedRecruiterNumber(e.target.value)}
                        placeholder="모집인 등록번호"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* 정산계좌 탭 */}
                {activeTab === 'account' && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">은행명</label>
                      <select
                        value={editedBankName}
                        onChange={(e) => setEditedBankName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">선택하세요</option>
                        {BANKS.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">예금주</label>
                      <input
                        type="text"
                        value={editedAccountHolder}
                        onChange={(e) => setEditedAccountHolder(e.target.value)}
                        placeholder="예금주명"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">계좌번호</label>
                      <input
                        type="text"
                        value={editedAccountNumber}
                        onChange={(e) => setEditedAccountNumber(e.target.value)}
                        placeholder="'-' 없이 입력"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 관리자 메모 */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">관리자 메모</h4>
                  <p className="text-xs text-amber-700">사용자에게 보이지 않음</p>
                </div>
              </div>
              <textarea
                value={editedMemo}
                onChange={(e) => setEditedMemo(e.target.value)}
                placeholder="관리자 전용 메모를 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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
  )
}

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
  const [isSaving, setIsSaving] = useState(false)
  const itemsPerPage = 50

  // 편집 상태
  const [editedPhone, setEditedPhone] = useState('')
  const [editedFax, setEditedFax] = useState('')
  const [editedMemo, setEditedMemo] = useState('')
  const [editedCompany, setEditedCompany] = useState('')
  const [editedPosition, setEditedPosition] = useState('')
  const [editedJoinDate, setEditedJoinDate] = useState('')
  const [editedRecruiterNumber, setEditedRecruiterNumber] = useState('')
  const [editedBankName, setEditedBankName] = useState('')
  const [editedAccountHolder, setEditedAccountHolder] = useState('')
  const [editedAccountNumber, setEditedAccountNumber] = useState('')

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
    setEditedFax(user.fax || '')
    setEditedMemo(user.admin_memo || '')
    setEditedCompany(user.company || '')
    setEditedPosition(user.position || '')
    setEditedJoinDate(user.join_date || '')
    setEditedRecruiterNumber(user.recruiter_number || '')
    setEditedBankName(user.bank_name || '')
    setEditedAccountHolder(user.account_holder || '')
    setEditedAccountNumber(user.account_number || '')
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
          fax: editedFax,
          admin_memo: editedMemo,
          company: editedCompany,
          position: editedPosition,
          join_date: editedJoinDate || null,
          recruiter_number: editedRecruiterNumber,
          bank_name: editedBankName,
          account_holder: editedAccountHolder,
          account_number: editedAccountNumber
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
                          onClick={(e) => e.stopPropagation()}
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
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
        <UserDetailModal
          user={selectedUser}
          editedPhone={editedPhone}
          editedFax={editedFax}
          editedMemo={editedMemo}
          editedCompany={editedCompany}
          editedPosition={editedPosition}
          editedJoinDate={editedJoinDate}
          editedRecruiterNumber={editedRecruiterNumber}
          editedBankName={editedBankName}
          editedAccountHolder={editedAccountHolder}
          editedAccountNumber={editedAccountNumber}
          setEditedPhone={setEditedPhone}
          setEditedFax={setEditedFax}
          setEditedMemo={setEditedMemo}
          setEditedCompany={setEditedCompany}
          setEditedPosition={setEditedPosition}
          setEditedJoinDate={setEditedJoinDate}
          setEditedRecruiterNumber={setEditedRecruiterNumber}
          setEditedBankName={setEditedBankName}
          setEditedAccountHolder={setEditedAccountHolder}
          setEditedAccountNumber={setEditedAccountNumber}
          isSaving={isSaving}
          onClose={() => setIsUserModalOpen(false)}
          onSave={handleSaveUserInfo}
          getRoleLabel={getRoleLabel}
        />
      )}
    </div>
  )
}
