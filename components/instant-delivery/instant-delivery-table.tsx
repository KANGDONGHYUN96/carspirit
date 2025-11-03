'use client'

import { useState, useMemo } from 'react'
import CapitalSlider from './capital-slider'

interface Vehicle {
  id: string
  source: string
  vehicle_name: string
  options: string | null
  exterior_color: string | null
  interior_color: string | null
  price: number | null
  promotion: string | null
  product_type: string | null
  note: string | null
  created_at: string
}

interface InstantDeliveryTableProps {
  vehicles: Vehicle[]
}

type Column = '출처' | '차량명' | '옵션' | '외장' | '내장' | '차량가' | '프로모션' | '상품구분' | '비고'

const COLUMNS: Column[] = ['출처', '차량명', '옵션', '외장', '내장', '차량가', '프로모션', '상품구분', '비고']

export default function InstantDeliveryTable({ vehicles }: InstantDeliveryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [filters, setFilters] = useState<Record<Column, string[]>>({
    '출처': [],
    '차량명': [],
    '옵션': [],
    '외장': [],
    '내장': [],
    '차량가': [],
    '프로모션': [],
    '상품구분': [],
    '비고': [],
  })
  const [openFilter, setOpenFilter] = useState<Column | null>(null)

  // 각 컬럼의 고유값 추출
  const getUniqueValues = (column: Column): string[] => {
    const key = getColumnKey(column)
    const values = vehicles
      .map(v => {
        const value = v[key]
        if (column === '차량가' && typeof value === 'number') {
          return value.toString()
        }
        return value
      })
      .filter((v): v is string => v != null && v !== '')

    return Array.from(new Set(values)).sort()
  }

  // 컬럼명을 객체 키로 변환
  const getColumnKey = (column: Column): keyof Vehicle => {
    const map: Record<Column, keyof Vehicle> = {
      '출처': 'source',
      '차량명': 'vehicle_name',
      '옵션': 'options',
      '외장': 'exterior_color',
      '내장': 'interior_color',
      '차량가': 'price',
      '프로모션': 'promotion',
      '상품구분': 'product_type',
      '비고': 'note',
    }
    return map[column]
  }

  // 컬럼별 너비 클래스
  const getColumnWidthClass = (column: Column): string => {
    const widthMap: Record<Column, string> = {
      '출처': 'w-24',
      '차량명': 'w-40',
      '옵션': 'w-40',
      '외장': 'w-28',
      '내장': 'w-28',
      '차량가': 'w-32',
      '프로모션': 'w-40',
      '상품구분': 'w-28',
      '비고': 'w-40',
    }
    return widthMap[column]
  }

  // 필터링된 차량 목록
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // 검색어 필터 (외장/내장 제외)
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        // 외장, 내장 색상은 검색에서 제외
        const searchableFields = [
          vehicle.source,
          vehicle.vehicle_name,
          vehicle.options,
          // vehicle.exterior_color,  // 제외
          // vehicle.interior_color,  // 제외
          vehicle.promotion,
          vehicle.product_type,
          vehicle.note,
        ].filter(Boolean).map(field => String(field).toLowerCase())

        // 정확한 단어 매칭 또는 단어의 시작 부분 매칭
        const found = searchableFields.some(field => {
          // 단어 경계를 고려한 정규식 생성
          const words = field.split(/[\s,\/\(\)]+/)
          // 정확히 일치하거나, 단어의 시작 부분이 검색어와 일치하는 경우만
          return words.some(word => word === query || word.startsWith(query))
        })

        if (!found) {
          return false
        }
      }

      // 컬럼별 필터
      for (const column of COLUMNS) {
        const selectedValues = filters[column]
        if (selectedValues.length > 0) {
          const key = getColumnKey(column)
          const value = vehicle[key]

          if (column === '차량가') {
            if (!selectedValues.includes(String(value))) {
              return false
            }
          } else {
            if (!selectedValues.includes(String(value ?? ''))) {
              return false
            }
          }
        }
      }

      return true
    })
  }, [vehicles, searchQuery, filters])

  // 필터 토글
  const toggleFilter = (column: Column, value: string) => {
    setFilters(prev => {
      const current = prev[column]
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]

      return { ...prev, [column]: newValues }
    })
  }

  // 값 표시
  const displayValue = (column: Column, vehicle: Vehicle) => {
    const key = getColumnKey(column)
    const value = vehicle[key]

    if (column === '차량가' && typeof value === 'number') {
      return value.toLocaleString() + '원'
    }

    return value || '-'
  }

  // 검색 실행
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true)
    }
  }

  // 엔터키로 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full">
      {/* 캐피탈 슬라이더 */}
      <div className="mb-8 px-8">
        <CapitalSlider />
      </div>

      {!hasSearched ? (
        /* 검색 시작 화면 - 좌측 정렬 */
        <div className="px-8 mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="차량명, 옵션 등 검색"
              className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 검색 후 - 상단 고정 검색창 */}
          <div className="px-8 mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="차량명, 옵션 등 검색"
                className="w-full px-6 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 테이블 - 스크롤 없음 */}
          <div className="px-8">
            <div className="w-full">
              <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 border-b-2 border-gray-300">
                    <tr>
                      {COLUMNS.map(column => (
                        <th key={column} className={`px-3 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200 last:border-r-0 ${getColumnWidthClass(column)}`}>
                          <div className="flex items-center justify-center gap-1">
                            <span className="whitespace-nowrap">{column}</span>
                            <div className="relative">
                              <button
                                onClick={() => setOpenFilter(openFilter === column ? null : column)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {openFilter === column && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenFilter(null)}
                                  />
                                  <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto min-w-[200px]">
                                    <div className="p-3">
                                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2 text-left">{column} 필터</div>
                                      {getUniqueValues(column).map(value => (
                                        <label
                                          key={value}
                                          className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm rounded whitespace-nowrap"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={filters[column].includes(value)}
                                            onChange={() => toggleFilter(column, value)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                          />
                                          <span className="text-gray-700 text-left">
                                            {column === '차량가' && !isNaN(Number(value))
                                              ? Number(value).toLocaleString() + '원'
                                              : value}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 border-r-0 whitespace-nowrap w-40">업로드시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map(vehicle => (
                        <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                          {COLUMNS.map(column => (
                            <td key={column} className={`px-3 py-3 text-sm text-gray-900 text-center border-r border-gray-200 last:border-r-0 whitespace-normal break-words ${getColumnWidthClass(column)}`}>
                              <div>
                                {displayValue(column, vehicle)}
                              </div>
                            </td>
                          ))}
                          <td className="px-3 py-3 text-sm text-gray-500 text-center whitespace-nowrap w-40">
                            {new Date(vehicle.created_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="px-3 py-12 text-center text-gray-500">
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
