import PublicInquiryForm from '@/components/inquiry/public-inquiry-form'

export const metadata = {
  title: '차량 문의하기 | 카스피릿',
  description: '차량 견적 및 상담 문의를 남겨주세요. 전문 상담사가 빠르게 연락드립니다.',
}

export default function PublicInquiryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            차량 문의하기
          </h1>
          <p className="text-lg text-gray-600">
            전문 상담사가 <span className="text-blue-600 font-semibold">빠르게</span> 연락드립니다
          </p>
        </div>

        {/* 폼 */}
        <PublicInquiryForm />

        {/* 안내 사항 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📌 안내사항</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 문의 접수 후 <strong>5분 이내</strong> 전문 상담사가 카카오톡으로 연락드립니다</li>
            <li>• 평일 09:00~18:00, 토요일 09:00~15:00 운영</li>
            <li>• 일요일 및 공휴일은 익일 순차 연락드립니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
