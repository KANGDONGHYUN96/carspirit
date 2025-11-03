'use client'

import { useMemo } from 'react'

interface Contract {
  id: string
  total_commission: number
  contract_date: string | null
}

interface MonthlyCommissionChartProps {
  contracts: Contract[]
}

export default function MonthlyCommissionChart({ contracts }: MonthlyCommissionChartProps) {
  // 월별 총수수료 계산
  const monthlyData = useMemo(() => {
    const dataMap: { [key: string]: number } = {}

    contracts.forEach(contract => {
      if (contract.contract_date) {
        const date = new Date(contract.contract_date)
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!dataMap[yearMonth]) {
          dataMap[yearMonth] = 0
        }
        dataMap[yearMonth] += contract.total_commission || 0
      }
    })

    // 최근 10개월 데이터 표시 (화면에 맞게)
    const sortedMonths = Object.keys(dataMap).sort().slice(-10)
    return sortedMonths.map(month => {
      const [year, monthNum] = month.split('-')
      return {
        month,
        total: dataMap[month],
        label: `${year}년 ${parseInt(monthNum)}월`
      }
    })
  }, [contracts])

  const maxValue = Math.max(...monthlyData.map(d => d.total), 0)

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">월별 총수수료</h2>
        <p className="text-sm text-gray-500">최근 10개월 수수료 현황</p>
      </div>

      {monthlyData.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>계약 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-8">
          {/* 세로 막대 차트 */}
          <div className="flex items-end justify-between gap-3 h-80">
            {monthlyData.map((data) => {
              const heightPercent = maxValue > 0 ? (data.total / maxValue) * 100 : 0
              const minHeight = data.total > 0 ? 5 : 0 // 최소 높이 설정
              const finalHeight = Math.max(heightPercent, minHeight)

              return (
                <div key={data.month} className="flex flex-col items-center flex-1">
                  {/* 금액 표시 */}
                  <div className="mb-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                    ₩{(data.total / 10000).toFixed(0)}만
                  </div>
                  {/* 막대 */}
                  <div className="relative w-full flex flex-col justify-end h-64">
                    {data.total > 0 && (
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all duration-500"
                        style={{ height: `${finalHeight}%` }}
                      />
                    )}
                  </div>
                  {/* 월 표시 */}
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    {data.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 총 합계 */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <span className="text-base font-semibold text-gray-700">총 합계</span>
            <span className="text-2xl font-bold text-blue-600">
              {monthlyData.reduce((sum, data) => sum + data.total, 0).toLocaleString()}원
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
