'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

interface Promotion {
  id: string
  capital: string
  rent_promotion: string | null
  lease_promotion: string | null
  strategic_models: string | null
  conditions: string | null
  start_date: string | null
  end_date: string | null
  status: string
  image_url: string | null
  created_at: string
}

interface Company {
  id: string
  company_name: string
  logo_url: string | null
}

interface PromotionsClientProps {
  promotions: Promotion[]
  companies: Company[]
}

export default function PromotionsClient({ promotions: initialPromotions, companies }: PromotionsClientProps) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState({
    capital: '',
    rent_promotion: '',
    lease_promotion: '',
    strategic_models: '',
    conditions: '',
    start_date: '',
    end_date: '',
    status: 'active',
    image_url: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const router = useRouter()

  const openModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion)
      setFormData({
        capital: promotion.capital,
        rent_promotion: promotion.rent_promotion || '',
        lease_promotion: promotion.lease_promotion || '',
        strategic_models: promotion.strategic_models || '',
        conditions: promotion.conditions || '',
        start_date: promotion.start_date || '',
        end_date: promotion.end_date || '',
        status: promotion.status,
        image_url: promotion.image_url || '',
      })
    } else {
      setEditingPromotion(null)
      setFormData({
        capital: '',
        rent_promotion: '',
        lease_promotion: '',
        strategic_models: '',
        conditions: '',
        start_date: '',
        end_date: '',
        status: 'active',
        image_url: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPromotion(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingPromotion
        ? `/api/promotions/${editingPromotion.id}`
        : '/api/promotions'

      const response = await fetch(url, {
        method: editingPromotion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('저장 실패')
      }

      closeModal()
      router.refresh()
    } catch (error) {
      setAlert({ message: '저장 실패', type: 'error' })
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirm({
      message: '이 프로모션을 삭제하시겠습니까?',
      onConfirm: async () => {
        setConfirm(null)
        try {
          const response = await fetch(`/api/promotions/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('삭제 실패')
          }

          router.refresh()
        } catch (error) {
          setAlert({ message: '삭제 실패', type: 'error' })
          console.error(error)
        }
      }
    })
  }

  return (
    <div>
      {/* 프로모션 추가 버튼 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <button
          onClick={() => openModal()}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          + 새 프로모션 추가
        </button>
      </div>

      {/* 프로모션 목록 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {promotions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">등록된 프로모션이 없습니다</p>
            <p className="text-sm mt-2">새 프로모션을 추가해보세요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캐피탈</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">렌트</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리스</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전략차종</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-blue-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{promo.capital}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{promo.rent_promotion || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{promo.lease_promotion || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{promo.strategic_models || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {promo.start_date && promo.end_date
                        ? `${promo.start_date} ~ ${promo.end_date}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          promo.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {promo.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => openModal(promo)}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-500 hover:text-red-600 font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPromotion ? '프로모션 수정' : '새 프로모션 추가'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">캐피탈사 *</label>
                <select
                  value={formData.capital}
                  onChange={(e) => {
                    const selectedCompany = companies.find(c => c.company_name === e.target.value)
                    setFormData({
                      ...formData,
                      capital: e.target.value,
                      image_url: selectedCompany?.logo_url || ''
                    })
                  }}
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <option value="">캐피탈사를 선택하세요</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.company_name}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">렌트</label>
                <input
                  type="text"
                  value={formData.rent_promotion}
                  onChange={(e) => setFormData({ ...formData, rent_promotion: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="예: 대리점 1.5P"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">리스</label>
                <input
                  type="text"
                  value={formData.lease_promotion}
                  onChange={(e) => setFormData({ ...formData, lease_promotion: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="예: 벤츠 / BMW / 아우디 1.5P"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">전략차종</label>
                <input
                  type="text"
                  value={formData.strategic_models}
                  onChange={(e) => setFormData({ ...formData, strategic_models: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="예: 싼타페 / 카니발 3P"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">조건 / 비고</label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="상세 조건 및 비고사항"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
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
        type="danger"
      />
    </div>
  )
}
