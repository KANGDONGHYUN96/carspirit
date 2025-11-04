'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  profile_image_url: string | null
  business_card_url: string | null
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

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      setMessage('❌ 이미지 파일만 업로드 가능합니다')
      return
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ 파일 크기는 5MB 이하여야 합니다')
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

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      const data = await response.json()

      if (type === 'profile') {
        setUser((prev) => ({ ...prev, profile_image_url: data.profile_image_url }))
        setMessage('✅ 프로필 사진이 업데이트되었습니다!')
      } else {
        setUser((prev) => ({ ...prev, business_card_url: data.business_card_url }))
        setMessage('✅ 명함이 업데이트되었습니다!')
      }
      setTimeout(() => setMessage(''), 3000)

      // 페이지 새로고침하여 사이드바 업데이트
      router.refresh()
    } catch (error) {
      setMessage('❌ 업로드 실패')
      console.error(error)
    } finally {
      if (type === 'profile') {
        setIsUploadingProfile(false)
      } else {
        setIsUploadingCard(false)
      }
    }
  }

  const handleDownloadCard = () => {
    if (user.business_card_url) {
      const link = document.createElement('a')
      link.href = user.business_card_url
      link.download = `명함_${user.name}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* 프로필 사진 */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                {user.name.charAt(0)}
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
          <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {(isUploadingProfile || isUploadingCard) && (
          <div className="mt-4 text-sm text-blue-600">업로드 중...</div>
        )}

        {message && (
          <div className="mt-4 text-sm font-medium">{message}</div>
        )}

        <p className="mt-4 text-sm text-gray-500">클릭하여 프로필 사진 변경</p>
      </div>

      {/* 사용자 정보 */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.name}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
              {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '영업자'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.phone || '미등록'}</div>
          </div>
        </div>
      </div>

      {/* 명함 섹션 */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">명함</h3>

        {user.business_card_url ? (
          <div className="space-y-4">
            <div className="relative bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <img
                src={user.business_card_url}
                alt="명함"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </div>

            <div className="flex gap-3">
              <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors text-center font-medium">
                명함 변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'card')}
                  disabled={isUploadingCard}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleDownloadCard}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                다운로드
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">명함이 등록되지 않았습니다</p>
              <label className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg cursor-pointer transition-colors font-medium">
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
