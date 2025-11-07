'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomAlert from '@/components/common/custom-alert'

export default function PublicInquiryForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    content: '',
    agree_privacy: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!formData.customer_name.trim()) {
      setAlert({ message: '이름을 입력해주세요', type: 'warning' })
      return
    }

    if (!formData.customer_phone.trim()) {
      setAlert({ message: '연락처를 입력해주세요', type: 'warning' })
      return
    }

    // 전화번호 형식 검증 (010-1234-5678 또는 01012345678)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(formData.customer_phone.replace(/-/g, ''))) {
      setAlert({ message: '올바른 전화번호 형식이 아닙니다', type: 'warning' })
      return
    }

    if (!formData.content.trim()) {
      setAlert({ message: '문의 내용을 입력해주세요', type: 'warning' })
      return
    }

    if (!formData.agree_privacy) {
      setAlert({ message: '개인정보 수집 및 이용에 동의해주세요', type: 'warning' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/inquiry/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test_api_key_12345', // 테스트용 키
        },
        body: JSON.stringify({
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          content: formData.content.trim(),
          source: '카스피릿',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '문의 접수 실패')
      }

      setAlert({
        message: '문의가 접수되었습니다! 곧 담당자가 카카오톡으로 연락드립니다.',
        type: 'success',
      })

      // 폼 초기화
      setFormData({
        customer_name: '',
        customer_phone: '',
        content: '',
        agree_privacy: false,
      })

      // 3초 후 리다이렉트 (선택사항)
      setTimeout(() => {
        // router.push('/') // 필요시 활성화
      }, 3000)
    } catch (error) {
      console.error('문의 접수 에러:', error)
      setAlert({
        message: error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhone = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '')

    // 010-1234-5678 형식으로 변환
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
        {/* 이름 */}
        <div className="mb-6">
          <label htmlFor="customer_name" className="block text-sm font-semibold text-gray-700 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            placeholder="홍길동"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* 연락처 */}
        <div className="mb-6">
          <label htmlFor="customer_phone" className="block text-sm font-semibold text-gray-700 mb-2">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="customer_phone"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: formatPhone(e.target.value) })}
            placeholder="010-1234-5678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* 문의 내용 */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
            문의 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="예) 현대 아이오닉5 장기렌트 견적 부탁드립니다&#10;· 차량: 아이오닉5&#10;· 옵션: 익스클루시브&#10;· 색상: 사이버그레이&#10;· 계약 형태: 장기렌트 (48개월)"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* 개인정보 동의 */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agree_privacy}
              onChange={(e) => setFormData({ ...formData, agree_privacy: e.target.checked })}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-gray-700">
              <strong className="text-gray-900">개인정보 수집 및 이용에 동의합니다.</strong>
              <br />
              <span className="text-xs text-gray-500">
                수집항목: 이름, 연락처, 문의내용 | 이용목적: 상담 및 견적 제공 | 보유기간: 상담 완료 후 1년
              </span>
            </span>
          </label>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isSubmitting ? '접수 중...' : '문의하기'}
        </button>
      </form>

      {/* 알림 모달 */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />
    </>
  )
}
