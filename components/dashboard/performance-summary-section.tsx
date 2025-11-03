interface PerformanceSummarySectionProps {
  contractCount: number
  totalRevenue: number
  avgCommissionRate: number
  previousMonthContractCount?: number
  previousMonthRevenue?: number
}

export default function PerformanceSummarySection({
  contractCount,
  totalRevenue,
  avgCommissionRate,
  previousMonthContractCount = 0,
  previousMonthRevenue = 0,
}: PerformanceSummarySectionProps) {
  // 증감률 계산
  const contractGrowth = previousMonthContractCount
    ? ((contractCount - previousMonthContractCount) / previousMonthContractCount) * 100
    : 0

  const revenueGrowth = previousMonthRevenue
    ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const renderGrowthBadge = (growth: number) => {
    if (growth === 0) return null

    const isPositive = growth > 0
    return (
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 이번달 계약건수 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {renderGrowthBadge(contractGrowth)}
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium text-gray-600 mb-1">이번달 계약건수</p>
            <p className="text-4xl font-bold text-gray-900">{contractCount}</p>
            <p className="text-sm text-gray-500 mt-1">건</p>
          </div>

          {previousMonthContractCount > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                지난달: <span className="font-medium text-gray-700">{previousMonthContractCount}건</span>
              </p>
            </div>
          )}
        </div>

        {/* 총 매출금액 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {renderGrowthBadge(revenueGrowth)}
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium text-gray-600 mb-1">총 매출금액</p>
            <p className="text-4xl font-bold text-gray-900">{formatNumber(totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">만원</p>
          </div>

          {previousMonthRevenue > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                지난달: <span className="font-medium text-gray-700">{formatNumber(previousMonthRevenue)}만원</span>
              </p>
            </div>
          )}
        </div>

        {/* 평균 수수료율 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            {avgCommissionRate >= 3.5 && (
              <div className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                우수
              </div>
            )}
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium text-gray-600 mb-1">평균 수수료율</p>
            <p className="text-4xl font-bold text-gray-900">{avgCommissionRate.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1">%</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">목표 수수료율</span>
              <span className="font-medium text-gray-700">4.0%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((avgCommissionRate / 4.0) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 추가 인사이트 */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">실적 인사이트</h3>
            <p className="text-sm text-gray-700">
              {contractCount === 0 ? (
                "이번 달 첫 계약을 달성하여 실적 목표를 향해 나아가세요!"
              ) : contractGrowth > 0 ? (
                `지난 달 대비 ${contractGrowth.toFixed(1)}% 성장하고 있습니다. 이 추세를 유지하세요!`
              ) : contractGrowth < 0 ? (
                "지난 달 대비 실적이 감소했습니다. 고객 문의에 더 집중해보세요."
              ) : (
                "지난 달과 비슷한 실적을 유지하고 있습니다. 목표 달성을 위해 조금 더 노력해보세요!"
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
