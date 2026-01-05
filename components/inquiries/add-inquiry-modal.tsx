'use client'

import { useState } from 'react'

interface AddInquiryModalProps {
  onClose: () => void
  onSuccess: () => void
  userId: string
  userName: string
}

export default function AddInquiryModal({ onClose, onSuccess, userId, userName }: AddInquiryModalProps) {
  const [formData, setFormData] = useState<{
    customer_name: string
    customer_phone: string
    content: string
    status: '신규' | '관리' | '부재' | '심사' | '가망' | '계약'
  }>({
    customer_name: '',
    customer_phone: '',
    content: '',
    status: '신규'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 전화번호 유효성 검사
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
      if (!phoneRegex.test(formData.customer_phone.replace(/-/g, ''))) {
        setError('올바른 전화번호 형식이 아닙니다.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          assigned_to_name: userName,
          source: '카스피릿'
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '문의 추가에 실패했습니다.')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 전화번호 자동 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '')

    if (value.length <= 3) {
      setFormData(prev => ({ ...prev, customer_phone: value }))
    } else if (value.length <= 7) {
      setFormData(prev => ({ ...prev, customer_phone: `${value.slice(0, 3)}-${value.slice(3)}` }))
    } else if (value.length <= 11) {
      setFormData(prev => ({ ...prev, customer_phone: `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}` }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">신규 고객 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 - 스크롤 영역 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* 담당자 정보 (읽기 전용) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">담당자</label>
                  <input
                    type="text"
                    value={userName}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">매체</label>
                  <input
                    type="text"
                    value="카스피릿"
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* 고객 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">고객 정보</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="customer_name" className="block text-xs text-gray-500 mb-1">
                    고객명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="예: 홍길동"
                  />
                </div>

                <div>
                  <label htmlFor="customer_phone" className="block text-xs text-gray-500 mb-1">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="customer_phone"
                    name="customer_phone"
                    required
                    value={formData.customer_phone}
                    onChange={handlePhoneChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="010-1234-5678"
                    maxLength={13}
                  />
                </div>
              </div>
            </div>

            {/* 문의 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">문의 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(['신규', '관리', '부재', '심사', '가망', '계약'] as const).map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: statusOption })}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                          formData.status === statusOption
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="content" className="block text-xs text-gray-500 mb-1">
                    문의내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    value={formData.content}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
                    placeholder="고객의 문의 내용을 입력하세요..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 - 고정 */}
          <div className="border-t border-gray-200 p-4 bg-white flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium transition-all"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '추가 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
