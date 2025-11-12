'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleGallery } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'
import JSZip from 'jszip'

interface VehicleGallerySectionProps {
  vehicles: VehicleGallery[]
  userId: string
  userName: string
  userRole: string
}

export default function VehicleGallerySection({ vehicles, userId, userName, userRole }: VehicleGallerySectionProps) {
  // 네비게이션 상태
  const [selectedCategory, setSelectedCategory] = useState<'domestic' | 'imported' | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleGallery | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [isZipPreviewOpen, setIsZipPreviewOpen] = useState(false)
  const [zipImages, setZipImages] = useState<string[]>([])
  const [isLoadingZip, setIsLoadingZip] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    trim: '',
    exterior_color: '',
    interior_color: '',
    options: '',
  })

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // 브랜드 정보 (국산/수입 분류)
  const brands = {
    domestic: [
      { name: '현대', logoPath: '/brands/domestic/hyundai.png' },
      { name: '기아', logoPath: '/brands/domestic/kia.png' },
      { name: '제네시스', logoPath: '/brands/domestic/genesis.png' },
      { name: 'KGM', logoPath: '/brands/domestic/kgm.png' },
      { name: '르노코리아', logoPath: '/brands/domestic/renault-korea.png' },
      { name: '쉐보레', logoPath: '/brands/domestic/chevrolet.png' },
    ],
    imported: [
      { name: 'BMW', logoPath: '/brands/imported/bmw.png' },
      { name: '벤츠', logoPath: '/brands/imported/benz.png' },
      { name: '아우디', logoPath: '/brands/imported/audi.png' },
      { name: '테슬라', logoPath: '/brands/imported/tesla.png' },
      { name: '볼보', logoPath: '/brands/imported/volvo.png' },
      { name: '폴스타', logoPath: '/brands/imported/polestar.png' },
    ],
  }

  // 브랜드별 차량 모델
  const brandModels: { [key: string]: string[] } = {
    '현대': ['아반떼', '싼타페', '그랜저', '쏘나타', '팰리세이드', '투싼', '코나', '포터2', '스타리아', '아이오닉5', '아이오닉9', '캐스퍼EV', '베뉴', '캐스퍼', '아이오닉6', '코나EV', '넥쏘', '포터2 EV', '아반떼N', '아이오닉6N'],
    '기아': ['쏘렌토', '스포티지', '카니발', '셀토스', 'K5', 'K8', '레이', 'EV3', '봉고3', 'PV5', '모닝', 'EV5', '니로', 'EV4', '레이EV', 'EV6', '타스만', 'EV9', 'K9', '니로EV'],
    '제네시스': ['GV80', 'GV70', 'G80', 'G70', 'G90', 'GV60', 'GV70 EV', 'G80 EV'],
    'KGM': ['토레스', '액티언', '무쏘', '티볼리', '렉스턴'],
    '르노코리아': ['그랑콜레오스', 'QM6', '아르카나', '세닉'],
    '쉐보레': ['트랙스', '트레일블레이저', '콜로라도'],
    'BMW': ['5 Series', '3 Series', 'X3', 'X5', 'X7', 'X4', '7 Series', 'i5', '4 Series', 'X1', 'iX3', 'X6', 'i4', 'iX1', 'iX', '1 Series', 'M3', 'X2', 'i7', '8 Series', 'iX2', 'Z4'],
    '벤츠': ['E-Class', 'GLC-Class', 'S-Class', 'GLE-Class', 'C-Class', 'CLE', 'CLS-Class', 'Maybach S-Class', 'The New G-Class', 'GLB-Class', 'EQA', 'AMG GT', 'G-Class', 'Maybach GLS', 'EQB', 'A-Class', 'EQE', 'EQS'],
    '아우디': ['A6', 'A5', 'Q6 e-tron', 'Q5', 'Q3', 'Q4 e-tron'],
    '테슬라': ['Model Y', 'Model 3', 'Model X', '사이버트럭', 'Model S'],
    '볼보': ['XC60', 'XC40', 'S90', 'XC90', 'EX30', 'V60', 'EX40', 'V90'],
    '폴스타': ['폴스타4', '폴스타2'],
  }

  // 선택된 브랜드의 차량 데이터에서 모델 목록 추출
  const getModelsForBrand = (brand: string) => {
    const brandVehicles = vehicles.filter(v => v.brand === brand)
    const uniqueModels = Array.from(new Set(brandVehicles.map(v => v.model)))
    return uniqueModels
  }

  // 선택된 모델의 차량들 필터링
  const getVehiclesForModel = (brand: string, model: string) => {
    return vehicles.filter(v => v.brand === brand && v.model === model)
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (selectedModel) {
      setSelectedModel(null)
    } else if (selectedBrand) {
      setSelectedBrand(null)
    } else if (selectedCategory) {
      setSelectedCategory(null)
    }
  }

  // 키보드 이벤트로 이미지 네비게이션
  useEffect(() => {
    if (selectedImageIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1)
      } else if (e.key === 'ArrowRight' && selectedImageIndex < zipImages.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1)
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, zipImages.length])

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

  // ZIP 파일에서 이미지 추출 (최적화: 점진적 로딩)
  const handleZipPreview = async (zipUrl: string) => {
    setIsLoadingZip(true)
    setIsZipPreviewOpen(true)
    setZipImages([])

    try {
      // ZIP 파일 다운로드
      const response = await fetch(zipUrl)
      if (!response.ok) throw new Error('ZIP 파일을 불러올 수 없습니다')

      const blob = await response.blob()
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(blob)

      // 이미지 파일만 필터링
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
      const imageFilesList: Array<{ filename: string; file: JSZip.JSZipObject }> = []

      // 이미지 파일 목록 먼저 수집
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue
        const ext = filename.split('.').pop()?.toLowerCase()
        if (ext && imageExtensions.includes(ext)) {
          imageFilesList.push({ filename, file })
        }
      }

      if (imageFilesList.length === 0) {
        setAlert({ message: 'ZIP 파일에 이미지가 없습니다', type: 'warning' })
        setIsZipPreviewOpen(false)
        setIsLoadingZip(false)
        return
      }

      // 로딩 완료 - 이미지는 나중에 로드
      setIsLoadingZip(false)

      // 이미지를 하나씩 점진적으로 로드
      const imageUrls: string[] = []
      for (let i = 0; i < imageFilesList.length; i++) {
        const { file } = imageFilesList[i]

        // Blob으로 변환 후 Object URL 생성 (Base64보다 훨씬 빠름)
        const imageBlob = await file.async('blob')
        const objectUrl = URL.createObjectURL(imageBlob)

        imageUrls.push(objectUrl)

        // 4개씩 로드할 때마다 UI 업데이트
        if (imageUrls.length % 4 === 0 || i === imageFilesList.length - 1) {
          setZipImages([...imageUrls])
          // 브라우저가 렌더링할 시간 주기
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    } catch (error) {
      console.error('ZIP 처리 에러:', error)
      setAlert({ message: 'ZIP 파일을 처리할 수 없습니다', type: 'error' })
      setIsZipPreviewOpen(false)
      setIsLoadingZip(false)
    }
  }

  return (
    <>
      <section className="mt-8 mb-12 px-8 pb-12">
        {/* 헤더 */}
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

        {/* 브레드크럼 네비게이션 */}
        {(selectedCategory || selectedBrand || selectedModel) && (
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {selectedCategory && (
                <span className="font-medium">{selectedCategory === 'domestic' ? '국산' : '수입'}</span>
              )}
              {selectedBrand && (
                <>
                  <span>›</span>
                  <span className="font-medium">{selectedBrand}</span>
                </>
              )}
              {selectedModel && (
                <>
                  <span>›</span>
                  <span className="font-medium">{selectedModel}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 1단계: 국산/수입 선택 + 브랜드 선택 */}
        {!selectedCategory && (
          <div className="space-y-8">
            {/* 국산 브랜드 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">국산</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {brands.domestic.map((brand) => (
                  <button
                    key={brand.name}
                    onClick={() => {
                      setSelectedCategory('domestic')
                      setSelectedBrand(brand.name)
                    }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center gap-2 group"
                  >
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors overflow-hidden">
                      <img
                        src={brand.logoPath}
                        alt={brand.name}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          // 이미지 로드 실패시 대체 이모지 표시
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl text-gray-400">🚗</span>'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 수입 브랜드 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">수입</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {brands.imported.map((brand) => (
                  <button
                    key={brand.name}
                    onClick={() => {
                      setSelectedCategory('imported')
                      setSelectedBrand(brand.name)
                    }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center gap-2 group"
                  >
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors overflow-hidden">
                      <img
                        src={brand.logoPath}
                        alt={brand.name}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          // 이미지 로드 실패시 대체 이모지 표시
                          e.currentTarget.style.display = 'none'
                          const emoji = brand.name === '테슬라' ? '⚡' : '🚗'
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl text-gray-400">${emoji}</span>`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2단계: 차량 모델 선택 */}
        {selectedCategory && selectedBrand && !selectedModel && (
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {getModelsForBrand(selectedBrand).length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{selectedBrand} 브랜드에 등록된 차량이 없습니다</p>
                </div>
              ) : (
                getModelsForBrand(selectedBrand).map((model) => (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center"
                  >
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm">
                      {model} <span className="text-xs text-gray-500 font-normal">({getVehiclesForModel(selectedBrand, model).length}개)</span>
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3단계: 출고사진 카드 */}
        {selectedCategory && selectedBrand && selectedModel && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {getVehiclesForModel(selectedBrand, selectedModel).map((vehicle) => (
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
                  {vehicle.trim && (
                    <p className="text-xs text-gray-600">등급: {vehicle.trim}</p>
                  )}
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
                {selectedVehicle.trim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">등급</label>
                    <p className="text-gray-900">{selectedVehicle.trim}</p>
                  </div>
                )}
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
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleZipPreview(selectedVehicle.zip_file_url)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  이미지 미리보기
                </button>
                <div className="flex gap-3">
                  <a
                    href={selectedVehicle.zip_file_url}
                    download
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
                  >
                    ZIP 다운로드
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
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value, model: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">브랜드를 선택하세요</option>
                    <optgroup label="국산">
                      {brands.domestic.map((brand) => (
                        <option key={brand.name} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="수입">
                      {brands.imported.map((brand) => (
                        <option key={brand.name} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 모델 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    모델 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    disabled={!formData.brand}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.brand ? '모델을 선택하세요' : '먼저 브랜드를 선택하세요'}
                    </option>
                    {formData.brand && brandModels[formData.brand]?.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    {formData.brand && brandModels[formData.brand]?.length === 0 && (
                      <option value="" disabled>등록된 모델이 없습니다 (직접 입력 가능)</option>
                    )}
                  </select>
                  {formData.brand && brandModels[formData.brand]?.length === 0 && (
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                      placeholder="모델명을 직접 입력하세요"
                    />
                  )}
                </div>

                {/* 등급 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                  <input
                    type="text"
                    value={formData.trim}
                    onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 프레스티지, 익스클루시브"
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

      {/* ZIP 이미지 미리보기 모달 */}
      {isZipPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            // Object URL 메모리 해제
            zipImages.forEach(url => URL.revokeObjectURL(url))
            setZipImages([])
            setIsZipPreviewOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">이미지 미리보기</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoadingZip ? '이미지 로딩 중...' : `총 ${zipImages.length}개의 이미지`}
                </p>
              </div>
              <button
                onClick={() => {
                  zipImages.forEach(url => URL.revokeObjectURL(url))
                  setZipImages([])
                  setIsZipPreviewOpen(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 이미지 그리드 */}
            <div className="p-6">
              {isLoadingZip ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">이미지를 불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {zipImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            {!isLoadingZip && zipImages.length > 0 && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <button
                  onClick={() => {
                    zipImages.forEach(url => URL.revokeObjectURL(url))
                    setZipImages([])
                    setIsZipPreviewOpen(false)
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 이미지 라이트박스 모달 */}
      {selectedImageIndex !== null && zipImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 이전 버튼 */}
            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(selectedImageIndex - 1)
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-3"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 이미지 */}
            <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={zipImages[selectedImageIndex]}
                alt={`Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {/* 이미지 카운터 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {selectedImageIndex + 1} / {zipImages.length}
              </div>
            </div>

            {/* 다음 버튼 */}
            {selectedImageIndex < zipImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(selectedImageIndex + 1)
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-3"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
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
