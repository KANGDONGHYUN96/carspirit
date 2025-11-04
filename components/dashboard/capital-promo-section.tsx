'use client'

import { useState, useEffect } from 'react'
import { CapitalPromotion } from '@/types/database.types'

interface CapitalPromoSectionProps {
  promotions: CapitalPromotion[]
}

export default function CapitalPromoSection({ promotions }: CapitalPromoSectionProps) {
  const [selectedPromo, setSelectedPromo] = useState<CapitalPromotion | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 무한 루프를 위해 프로모션 배열을 3번 복제
  const infinitePromotions = [...promotions, ...promotions, ...promotions]

  // 자동 슬라이드 (8초마다)
  useEffect(() => {
    if (promotions.length === 0) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    }, 8000)

    return () => clearInterval(interval)
  }, [promotions.length])

  const scroll = (direction: 'left' | 'right') => {
    if (isTransitioning || promotions.length === 0) return

    setIsTransitioning(true)

    if (direction === 'right') {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(prev => prev - 1)
    }

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  // 무한 루프를 위한 인덱스 조정
  const getTransformIndex = () => {
    // 초기 위치는 중간 세트
    const baseIndex = currentIndex + promotions.length

    // 경계 체크 및 순간이동
    if (currentIndex >= promotions.length) {
      setTimeout(() => {
        setCurrentIndex(0)
      }, 500)
      return baseIndex
    } else if (currentIndex < 0) {
      setTimeout(() => {
        setCurrentIndex(promotions.length - 1)
      }, 500)
      return baseIndex
    }

    return baseIndex
  }

  if (!promotions || promotions.length === 0) {
    return (
      <section className="mt-8 mb-12 px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">금융사 운용조건</h2>
          <p className="text-sm text-gray-500">각 금융사별 렌트/리스 프로모션 및 전략차종을 확인하세요</p>
        </div>
        <p className="text-gray-500 py-12 text-center">등록된 프로모션이 없습니다.</p>
      </section>
    )
  }

  return (
    <section className="mt-8 mb-12 px-8 pb-12 border-b border-gray-300">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">금융사 운용조건</h2>
          <p className="text-sm text-gray-500">각 금융사별 렌트/리스 프로모션 및 전략차종을 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="이전"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="다음"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-4"
          style={{
            transform: `translateX(calc(-${getTransformIndex()} * (calc((100% - 3rem) / 4) + 1rem)))`,
            transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none'
          }}
        >
          {infinitePromotions.map((promo, index) => (
            <div
              key={`${promo.id}-${index}`}
              onClick={() => setSelectedPromo(promo)}
              className="flex-shrink-0 w-[calc((100%_-_3rem)_/_4)] bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
            <div className="relative h-32 bg-white overflow-hidden flex items-center justify-center border-b border-gray-200 p-4">
              {promo.image_url ? (
                <img
                  src={promo.image_url}
                  alt={promo.capital}
                  className="max-w-[60%] max-h-[70%] object-contain"
                />
              ) : (
                <div className="text-gray-400 text-2xl font-bold">{promo.capital}</div>
              )}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  promo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {promo.status === 'active' ? '진행중' : '종료'}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-gray-900">{promo.capital}</span>
              </div>
              <div className="space-y-2 mb-4">
                {promo.rent_promotion && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[50px]">렌트</span>
                    <span className="text-sm text-gray-600">{promo.rent_promotion}</span>
                  </div>
                )}
                {promo.lease_promotion && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[50px]">리스</span>
                    <span className="text-sm text-gray-600">{promo.lease_promotion}</span>
                  </div>
                )}
                {promo.strategic_models && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[50px]">전략차종</span>
                    <span className="text-sm text-gray-600">{promo.strategic_models}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pt-3 border-t border-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">
                  {promo.start_date && promo.end_date &&
                    `${new Date(promo.start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ ${new Date(promo.end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
                  }
                </span>
              </div>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm">
                자세히 보기
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPromo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPromo(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold text-gray-900">{selectedPromo.capital}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPromo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedPromo.status === 'active' ? '진행중' : '종료'}
                  </span>
                </div>
                {selectedPromo.start_date && selectedPromo.end_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(selectedPromo.start_date).toLocaleDateString('ko-KR')} ~ {new Date(selectedPromo.end_date).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedPromo(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 캐피탈 로고 */}
            {selectedPromo.image_url && (
              <div className="mb-8 flex items-center justify-center py-4">
                <img src={selectedPromo.image_url} alt={selectedPromo.capital} className="h-10 object-contain" />
              </div>
            )}

            {/* 프로모션 내용 */}
            <div className="space-y-6 mb-8">
              {selectedPromo.rent_promotion && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">렌트</p>
                  <p className="text-base text-gray-900">{selectedPromo.rent_promotion}</p>
                </div>
              )}
              {selectedPromo.lease_promotion && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">리스</p>
                  <p className="text-base text-gray-900">{selectedPromo.lease_promotion}</p>
                </div>
              )}
              {selectedPromo.strategic_models && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">전략차종</p>
                  <p className="text-base text-gray-900">{selectedPromo.strategic_models}</p>
                </div>
              )}
              {selectedPromo.conditions && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">조건 / 비고</p>
                  <p className="text-base text-gray-600 whitespace-pre-line leading-relaxed">{selectedPromo.conditions}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setSelectedPromo(null)} className="w-full hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
