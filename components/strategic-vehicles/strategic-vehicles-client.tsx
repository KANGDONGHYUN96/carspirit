'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

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

interface Company {
  id: string
  company_name: string
  logo_url: string | null
}

interface StrategicVehiclesClientProps {
  vehicles: StrategicVehicle[]
  companies: Company[]
}

export default function StrategicVehiclesClient({ vehicles: initialVehicles, companies }: StrategicVehiclesClientProps) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<StrategicVehicle | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    manufacturer: '',
    model_name: '',
    trim: '',
    vehicle_options: '',
    exterior_color: '',
    interior_color: '',
    price: '',
    promotion_content: '',
    capital_logo: '',
    vehicle_image: '',
    notes: '',
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const router = useRouter()

  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  const handleNumberInput = (field: string, value: string) => {
    const num = value.replace(/[^\d]/g, '')
    setFormData({ ...formData, [field]: num })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/strategic-vehicles/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) throw new Error('업로드 실패')

      const { url } = await response.json()
      setFormData({ ...formData, vehicle_image: url })
    } catch (error) {
      setAlert({ message: '이미지 업로드에 실패했습니다.', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const openModal = (vehicle?: StrategicVehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setFormData({
        manufacturer: vehicle.manufacturer,
        model_name: vehicle.model_name,
        trim: vehicle.trim,
        vehicle_options: vehicle.vehicle_options || '',
        exterior_color: vehicle.exterior_color || '',
        interior_color: vehicle.interior_color || '',
        price: vehicle.price.toString(),
        promotion_content: vehicle.promotion_content || '',
        capital_logo: vehicle.capital_logo || '',
        vehicle_image: vehicle.vehicle_image || '',
        notes: vehicle.notes || '',
        is_active: vehicle.is_active,
      })
    } else {
      setEditingVehicle(null)
      setFormData({
        manufacturer: '',
        model_name: '',
        trim: '',
        vehicle_options: '',
        exterior_color: '',
        interior_color: '',
        price: '',
        promotion_content: '',
        capital_logo: '',
        vehicle_image: '',
        notes: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVehicle(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        manufacturer: formData.manufacturer,
        model_name: formData.model_name,
        trim: formData.trim,
        vehicle_options: formData.vehicle_options || null,
        exterior_color: formData.exterior_color || null,
        interior_color: formData.interior_color || null,
        price: parseInt(formData.price),
        promotion_content: formData.promotion_content || null,
        capital_logo: formData.capital_logo || null,
        vehicle_image: formData.vehicle_image || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      }

      const url = editingVehicle
        ? `/api/strategic-vehicles/${editingVehicle.id}`
        : '/api/strategic-vehicles'

      const response = await fetch(url, {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('저장 실패')

      closeModal()
      router.refresh()
    } catch (error) {
      setAlert({ message: '저장 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, vehicleName: string) => {
    setConfirm({
      message: `"${vehicleName}"을(를) 삭제하시겠습니까?`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          const response = await fetch(`/api/strategic-vehicles/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) throw new Error('삭제 실패')

          router.refresh()
        } catch (error) {
          setAlert({ message: '삭제 중 오류가 발생했습니다.', type: 'error' })
        }
      }
    })
  }

  const filteredVehicles = filterActive === null
    ? vehicles
    : vehicles.filter(vehicle => vehicle.is_active === filterActive)

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">전략차종 관리</h1>
            <p className="text-sm text-gray-500">전략차종 정보를 관리하세요</p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            + 새 전략차종 추가
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              filterActive === null ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              filterActive === true ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            활성
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              filterActive === false ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            비활성
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">제조사</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">모델명</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">등급</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">외장색상</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">내장색상</th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase">차량가</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">캐피탈</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">프로모션</th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className={`hover:bg-gray-50 ${!vehicle.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                <td className="px-4 py-5 text-sm text-gray-900">{vehicle.manufacturer}</td>
                <td className="px-4 py-5 text-sm text-gray-900">{vehicle.model_name}</td>
                <td className="px-4 py-5 text-sm text-gray-600">{vehicle.trim}</td>
                <td className="px-4 py-5 text-sm text-gray-600">{vehicle.exterior_color || '-'}</td>
                <td className="px-4 py-5 text-sm text-gray-600">{vehicle.interior_color || '-'}</td>
                <td className="px-4 py-5 text-sm text-gray-900 text-right">{vehicle.price.toLocaleString()}원</td>
                <td className="px-4 py-5">
                  {vehicle.capital_logo && <img src={vehicle.capital_logo} alt="캐피탈" className="h-5 object-contain" />}
                </td>
                <td className="px-4 py-5 text-sm text-gray-600 max-w-xs truncate">{vehicle.promotion_content || '-'}</td>
                <td className="px-4 py-5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => openModal(vehicle)} className="text-blue-600 hover:text-blue-700 font-medium">
                      수정
                    </button>
                    <button onClick={() => handleDelete(vehicle.id, vehicle.model_name)} className="text-red-600 hover:text-red-700 font-medium">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">등록된 전략차종이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVehicle ? '전략차종 수정' : '새 전략차종 추가'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">차량 이미지</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">차량 사진 업로드</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                  {isUploading && <p className="text-sm text-gray-500 mt-2">업로드 중...</p>}
                  {formData.vehicle_image && (
                    <img src={formData.vehicle_image} alt="미리보기" className="mt-4 w-full h-48 object-cover rounded-lg" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">차량 기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제조사 *</label>
                    <select required value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                      <option value="">선택하세요</option>
                      <option value="현대">현대</option>
                      <option value="기아">기아</option>
                      <option value="제네시스">제네시스</option>
                      <option value="르노">르노</option>
                      <option value="쉐보레">쉐보레</option>
                      <option value="벤츠">벤츠</option>
                      <option value="BMW">BMW</option>
                      <option value="아우디">아우디</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">모델명 *</label>
                    <input required type="text" value={formData.model_name} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">등급 *</label>
                    <input required type="text" value={formData.trim} onChange={(e) => setFormData({ ...formData, trim: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">차량가 *</label>
                    <input required type="text" value={formatNumber(formData.price)} onChange={(e) => handleNumberInput('price', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">옵션</label>
                    <input type="text" value={formData.vehicle_options} onChange={(e) => setFormData({ ...formData, vehicle_options: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="선루프, 통풍시트 등" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">외장 색상</label>
                    <input type="text" value={formData.exterior_color} onChange={(e) => setFormData({ ...formData, exterior_color: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">내장 색상</label>
                    <input type="text" value={formData.interior_color} onChange={(e) => setFormData({ ...formData, interior_color: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">프로모션 정보</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제휴 캐피탈</label>
                  <select value={formData.capital_logo} onChange={(e) => setFormData({ ...formData, capital_logo: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                    <option value="">선택 안함</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.logo_url || ''}>{company.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">프로모션 내용</label>
                  <textarea value={formData.promotion_content} onChange={(e) => setFormData({ ...formData, promotion_content: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">기타</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">비고</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">활성 상태</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" disabled={isSaving || isUploading} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  {isSaving ? '저장 중...' : editingVehicle ? '수정' : '추가'}
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
    </>
  )
}
