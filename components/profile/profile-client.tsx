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
}

interface ProfileClientProps {
  user: User
}

export default function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const [user, setUser] = useState(initialUser)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      const data = await response.json()

      setUser((prev) => ({ ...prev, profile_image_url: data.profile_image_url }))
      setMessage('✅ 프로필 사진이 업데이트되었습니다!')
      setTimeout(() => setMessage(''), 3000)

      // 페이지 새로고침하여 사이드바 업데이트
      router.refresh()
    } catch (error) {
      setMessage('❌ 업로드 실패')
      console.error(error)
    } finally {
      setIsUploading(false)
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
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {isUploading && (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
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
    </div>
  )
}
