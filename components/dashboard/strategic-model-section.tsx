'use client'

import { useState } from 'react'

interface StrategicVehicle {
  id: string
  manufacturer: string
  model_name: string
  trim: string
  vehicle_options: string | null
  exterior_color: string | null
  interior_color: string | null
  price: number
  promotion_content: string | null
  capital_logo: string | null
  vehicle_image: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

interface StrategicModelSectionProps {
  models: StrategicVehicle[]
}

export default function StrategicModelSection({ models }: StrategicModelSectionProps) {
  const [startIndex, setStartIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState<StrategicVehicle | null>(null)
  const cardsPerView = 5

  const visibleModels = models.slice(startIndex, startIndex + cardsPerView)
  const canGoPrev = startIndex > 0
  const canGoNext = startIndex + cardsPerView < models.length

  const goToPrevious = () => {
    if (canGoPrev) setStartIndex(startIndex - 1)
  }

  const goToNext = () => {
    if (canGoNext) setStartIndex(startIndex + 1)
  }

  if (!models || models.length === 0) {
    return (
      <section className="mb-12 px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">전략차종</h2>
          <p className="text-sm text-gray-500">이달의 특가 전략차종을 확인하세요</p>
        </div>
        <p className="text-gray-500 py-12 text-center">등록된 전략차종이 없습니다.</p>
      </section>
    )
  }

  return (
    <section className="mb-12 px-8 pb-12 border-b border-gray-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">전략차종</h2>
          <p className="text-sm text-gray-500">이달의 특가 전략차종을 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToPrevious}
            disabled={!canGoPrev}
            className={`p-2 rounded-lg transition-all ${canGoPrev ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className={`p-2 rounded-lg transition-all ${canGoNext ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-4">
        {visibleModels.map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group overflow-hidden w-[260px]"
          >
            {/* 캐피탈 로고 */}
            {model.capital_logo && (
              <div className="flex items-center justify-center py-2 border-b border-gray-200 bg-white">
                <img src={model.capital_logo} alt="제휴 캐피탈" className="h-5 object-contain" />
              </div>
            )}

            {/* 차량 이미지 */}
            <div className="relative h-40 bg-gray-50 overflow-hidden border-b border-gray-200">
              {model.vehicle_image ? (
                <img src={model.vehicle_image} alt={model.model_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}

              {/* 제조사 뱃지 */}
              <div className="absolute bottom-2 left-2">
                <span className="bg-white/90 backdrop-blur-sm border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-900">
                  {model.manufacturer}
                </span>
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{model.model_name}</h3>
              <p className="text-sm text-gray-600 mb-3 truncate">{model.trim}</p>

              <div className="space-y-1.5 text-xs">
                {model.vehicle_options && (
                  <div className="flex items-start">
                    <span className="text-gray-500 min-w-[50px]">옵션:</span>
                    <span className="font-medium text-gray-700 line-clamp-1">{model.vehicle_options}</span>
                  </div>
                )}
                {(model.exterior_color || model.interior_color) && (
                  <div className="flex items-start">
                    <span className="text-gray-500 min-w-[50px]">색상:</span>
                    <span className="font-medium text-gray-700">
                      {model.exterior_color && <span>{model.exterior_color}</span>}
                      {model.exterior_color && model.interior_color && <span> / </span>}
                      {model.interior_color && <span>{model.interior_color}</span>}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">차량가:</span>
                  <span className="font-semibold text-blue-600">{model.price.toLocaleString()}원</span>
                </div>
                {model.promotion_content && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-green-600 font-medium line-clamp-2">{model.promotion_content}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 인디케이터 */}
      {models.length > cardsPerView && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(models.length / cardsPerView) }).map((_, index) => {
            const isActive = Math.floor(startIndex / cardsPerView) === index
            return (
              <button
                key={index}
                onClick={() => setStartIndex(index * cardsPerView)}
                className={`h-2 rounded-full transition-all ${isActive ? 'w-8 bg-blue-500' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            )
          })}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedModel(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">{selectedModel.manufacturer}</p>
                <h3 className="text-3xl font-bold text-gray-900">{selectedModel.model_name}</h3>
                <p className="text-lg text-gray-600 mt-1">{selectedModel.trim}</p>
              </div>
              <button onClick={() => setSelectedModel(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 캐피탈 로고 */}
            {selectedModel.capital_logo && (
              <div className="mb-6 flex items-center justify-center py-3">
                <img src={selectedModel.capital_logo} alt="제휴 캐피탈" className="h-6 object-contain" />
              </div>
            )}

            {/* 차량 이미지 */}
            <div className="relative h-72 bg-gray-50 rounded-xl overflow-hidden mb-8">
              {selectedModel.vehicle_image ? (
                <img src={selectedModel.vehicle_image} alt={selectedModel.model_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
            </div>

            {/* 차량 정보 */}
            <div className="space-y-6 mb-8">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">차량가</span>
                  <span className="text-2xl font-bold text-gray-900">{selectedModel.price.toLocaleString()}원</span>
                </div>
              </div>

              {selectedModel.vehicle_options && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">옵션</p>
                  <p className="text-base text-gray-900">{selectedModel.vehicle_options}</p>
                </div>
              )}

              {(selectedModel.exterior_color || selectedModel.interior_color) && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">색상</p>
                  <div className="flex gap-8">
                    {selectedModel.exterior_color && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">외장</p>
                        <p className="text-base text-gray-900">{selectedModel.exterior_color}</p>
                      </div>
                    )}
                    {selectedModel.interior_color && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">내장</p>
                        <p className="text-base text-gray-900">{selectedModel.interior_color}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedModel.promotion_content && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">프로모션</p>
                  <p className="text-base text-green-600 font-medium whitespace-pre-line leading-relaxed">{selectedModel.promotion_content}</p>
                </div>
              )}

              {selectedModel.notes && (
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">비고</p>
                  <p className="text-base text-gray-600 whitespace-pre-line leading-relaxed">{selectedModel.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setSelectedModel(null)} className="w-full hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
