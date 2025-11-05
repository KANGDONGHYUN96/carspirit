'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleGallery } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'

interface VehicleGallerySectionProps {
  vehicles: VehicleGallery[]
  userId: string
  userName: string
  userRole: string
}

export default function VehicleGallerySection({ vehicles, userId, userName, userRole }: VehicleGallerySectionProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleGallery | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    exterior_color: '',
    interior_color: '',
    options: '',
  })

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // 썸네일 파일 선택
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // ZIP 파일 선택
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.zip')) {
      setZipFile(file)
    } else {
      setAlert({ message: 'ZIP 파일만 업로드 가능합니다', type: 'error' })
    }
  }

  // 파일 업로드 (Supabase Storage에 직접 업로드)
  const uploadFile = async (file: File, type: 'thumbnail' | 'zip'): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const uniqueId = crypto.randomUUID()
    const folder = type === 'thumbnail' ? 'vehicle-thumbnails' : 'vehicle-zips'
    const filePath = `${folder}/${userId}/${uniqueId}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError)
      throw new Error(uploadError.message || '파일 업로드 실패')
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // 차량 추가
  const handleSubmit = async () => {
    if (!formData.brand || !formData.model) {
      setAlert({ message: '브랜드와 모델을 입력하세요', type: 'warning' })
      return
    }

    if (!thumbnailFile || !zipFile) {
      setAlert({ message: '썸네일 이미지와 ZIP 파일을 모두 선택하세요', type: 'warning' })
      return
    }

    setIsUploading(true)
    try {
      // 파일 업로드
      const thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnail')
      const zipUrl = await uploadFile(zipFile, 'zip')

      // 데이터베이스에 저장
      const response = await fetch('/api/vehicle-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          thumbnail_url: thumbnailUrl,
          zip_file_url: zipUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '저장 실패')
      }

      setAlert({ message: '차량이 추가되었습니다', type: 'success' })
      setIsUploadModalOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      setAlert({ message: `업로드 실패: ${error.message}`, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  // 차량 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 차량을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/vehicle-gallery?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '삭제 실패')
      }

      setAlert({ message: '차량이 삭제되었습니다', type: 'success' })
      setSelectedVehicle(null)
      router.refresh()
    } catch (error: any) {
      setAlert({ message: `삭제 실패: ${error.message}`, type: 'error' })
    }
  }

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      exterior_color: '',
      interior_color: '',
      options: '',
    })
    setThumbnailFile(null)
    setZipFile(null)
    setThumbnailPreview(null)
  }

  return (
    <>
      <section className="mt-8 mb-12 px-8 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">출고 사진모음</h2>
            <p className="text-sm text-gray-500">차량 출고 사진 및 자료를 공유하세요</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + 새 차량 추가
          </button>
        </div>

        {/* 차량 카드 그리드 */}
        {vehicles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">등록된 차량이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {/* 썸네일 */}
                <div className="relative h-32 bg-gray-100">
                  <img
                    src={vehicle.thumbnail_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  {vehicle.exterior_color && (
                    <p className="text-xs text-gray-600">외장: {vehicle.exterior_color}</p>
                  )}
                  {vehicle.interior_color && (
                    <p className="text-xs text-gray-600">내장: {vehicle.interior_color}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{vehicle.user_name}</p>
                </div>
              </div>
            ))}

            {/* 새 페이지 추가 카드 */}
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-52 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <div className="text-center">
                <svg
                  className="mx-auto w-10 h-10 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-gray-500 font-medium text-sm">새 페이지 추가</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 차량 상세 모달 */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVehicle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 썸네일 */}
            <div className="relative h-64 bg-gray-100">
              <img
                src={selectedVehicle.thumbnail_url}
                alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 내용 */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h2>

              <div className="space-y-3 mb-6">
                {selectedVehicle.exterior_color && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">외장 색상</label>
                    <p className="text-gray-900">{selectedVehicle.exterior_color}</p>
                  </div>
                )}
                {selectedVehicle.interior_color && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">내장 색상</label>
                    <p className="text-gray-900">{selectedVehicle.interior_color}</p>
                  </div>
                )}
                {selectedVehicle.options && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">옵션</label>
                    <p className="text-gray-900 whitespace-pre-line">{selectedVehicle.options}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">등록자</label>
                  <p className="text-gray-900">{selectedVehicle.user_name}</p>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <a
                  href={selectedVehicle.zip_file_url}
                  download
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
                >
                  ZIP 파일 다운로드
                </a>
                {(selectedVehicle.user_id === userId || userRole === 'admin' || userRole === 'manager') && (
                  <button
                    onClick={() => handleDelete(selectedVehicle.id)}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !isUploading && setIsUploadModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">새 차량 추가</h2>

              <div className="space-y-4">
                {/* 브랜드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    브랜드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 기아"
                  />
                </div>

                {/* 모델 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    모델 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: EV3"
                  />
                </div>

                {/* 외장 색상 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">외장 색상</label>
                  <input
                    type="text"
                    value={formData.exterior_color}
                    onChange={(e) => setFormData({ ...formData, exterior_color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 블랙/그레이"
                  />
                </div>

                {/* 내장 색상 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내장 색상</label>
                  <input
                    type="text"
                    value={formData.interior_color}
                    onChange={(e) => setFormData({ ...formData, interior_color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 블랙"
                  />
                </div>

                {/* 옵션 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">옵션</label>
                  <textarea
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="옵션 정보를 입력하세요"
                  />
                </div>

                {/* 썸네일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    썸네일 이미지 <span className="text-red-500">*</span>
                  </label>
                  {thumbnailPreview && (
                    <div className="mb-2">
                      <img src={thumbnailPreview} alt="미리보기" className="h-32 rounded-lg object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* ZIP 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    차량 파일 (ZIP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleZipChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {zipFile && (
                    <p className="text-sm text-gray-600 mt-1">선택된 파일: {zipFile.name}</p>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {isUploading ? '업로드 중...' : '추가'}
                </button>
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    resetForm()
                  }}
                  disabled={isUploading}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />
    </>
  )
}
