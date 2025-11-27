import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'
import DashboardLayout from '@/components/layout/dashboard-layout'
import SalesAnalytics from '@/components/admin/sales-analytics'

export default async function SalesPage() {
  const user = await getCurrentUser()

  // 관리자만 접근 가능
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // 모든 계약 데이터 가져오기
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .order('contract_date', { ascending: false })

  // 사용자 목록 가져오기 (영업자별 통계를 위해)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('approved', true)

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900">매출관리</h1>
          <p className="text-gray-600 mt-1">
            계약 데이터 관리 및 수정 (관리자 전용)
          </p>
        </div>

        {/* 매출 분석 컴포넌트 */}
        <SalesAnalytics
          contracts={contracts || []}
          users={users || []}
        />
      </div>
    </DashboardLayout>
  )
}
