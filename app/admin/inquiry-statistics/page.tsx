import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InquiryAnalytics from '@/components/admin/inquiry-analytics'

export default async function InquiryStatisticsPage() {
  const user = await getCurrentUser()

  // 관리자만 접근 가능
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // 모든 문의 데이터 가져오기
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

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
          <h1 className="text-3xl font-bold text-gray-900">문의통계</h1>
          <p className="text-gray-600 mt-1">
            매체별 문의 현황 및 성과 분석 (관리자 전용)
          </p>
        </div>

        {/* 문의 분석 컴포넌트 */}
        <InquiryAnalytics
          inquiries={inquiries || []}
          users={users || []}
        />
      </div>
    </DashboardLayout>
  )
}
