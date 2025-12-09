'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  fax: string | null
  role: string
  profile_image_url: string | null
  business_card_url: string | null
  company: string | null
  position: string | null
  join_date: string | null
  recruiter_number: string | null
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  created_at?: string
}

interface ProfileClientProps {
  user: User
}

export default function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const [user, setUser] = useState(initialUser)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isUploadingCard, setIsUploadingCard] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'card') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('이미지 파일만 업로드 가능합니다')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('파일 크기는 5MB 이하여야 합니다')
      return
    }

    if (type === 'profile') {
      setIsUploadingProfile(true)
    } else {
      setIsUploadingCard(true)
    }
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('업로드 실패')

      const data = await response.json()

      if (type === 'profile') {
        setUser((prev) => ({ ...prev, profile_image_url: data.profile_image_url }))
        setMessage('프로필 사진이 업데이트되었습니다!')
      } else {
        setUser((prev) => ({ ...prev, business_card_url: data.business_card_url }))
        setMessage('명함이 업데이트되었습니다!')
      }
      setTimeout(() => setMessage(''), 3000)
      router.refresh()
    } catch (error) {
      setMessage('업로드 실패')
      console.error(error)
    } finally {
      if (type === 'profile') {
        setIsUploadingProfile(false)
      } else {
        setIsUploadingCard(false)
      }
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자'
      case 'manager': return '매니저'
      case 'salesperson': return '영업자'
      default: return role
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  // 노션 스타일 항목 컴포넌트
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-3 px-3 rounded">
      <span className="w-32 flex-shrink-0 text-sm text-gray-500">{label}</span>
      <span className="flex-1 text-sm text-gray-900">{value || '-'}</span>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 프로필 헤더 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-8">
          {/* 프로필 사진 */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-50">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'profile')}
                disabled={isUploadingProfile}
                className="hidden"
              />
            </label>
          </div>

          {/* 기본 정보 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-blue-500 mt-1">{getRoleLabel(user.role)}</p>
            <p className="text-gray-500 mt-2">{user.email}</p>
            {user.company && <p className="text-gray-500">{user.company}</p>}
          </div>
        </div>

        {/* 업로드 메시지 */}
        {(isUploadingProfile || isUploadingCard || message) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            {(isUploadingProfile || isUploadingCard) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                업로드 중...
              </div>
            )}
            {message && <div className="text-sm text-green-600">{message}</div>}
          </div>
        )}
      </div>

      {/* 인적사항 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">인적사항</h3>
        <div>
          <InfoRow label="이름" value={user.name} />
          <InfoRow label="연락처" value={user.phone || ''} />
          <InfoRow label="이메일" value={user.email} />
          <InfoRow label="팩스" value={user.fax || ''} />
          <InfoRow label="역할" value={getRoleLabel(user.role)} />
          <InfoRow label="가입일" value={formatDate(user.created_at)} />
        </div>
      </div>

      {/* 회사/업무 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">회사/업무 정보</h3>
        <div>
          <InfoRow label="소속" value={user.company || ''} />
          <InfoRow label="직급" value={user.position || ''} />
          <InfoRow label="입사일" value={formatDate(user.join_date)} />
          <InfoRow label="모집인 번호" value={user.recruiter_number || ''} />
        </div>
      </div>

      {/* 정산계좌 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">정산계좌</h3>
        <div>
          <InfoRow label="은행명" value={user.bank_name || ''} />
          <InfoRow label="예금주" value={user.account_holder || ''} />
          <InfoRow label="계좌번호" value={user.account_number || ''} />
        </div>
      </div>

      {/* 명함 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">명함</h3>

        {user.business_card_url ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-center">
              <img
                src={user.business_card_url}
                alt="명함"
                className="max-w-md rounded-lg shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <label className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                명함 변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'card')}
                  disabled={isUploadingCard}
                  className="hidden"
                />
              </label>
              <a
                href={user.business_card_url}
                download={`명함_${user.name}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                다운로드
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-200">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">명함이 등록되지 않았습니다</p>
              <label className="mt-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                명함 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'card')}
                  disabled={isUploadingCard}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
