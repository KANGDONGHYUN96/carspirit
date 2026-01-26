import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import SuccessionInquiriesTable from '@/components/succession-inquiries/succession-inquiries-table'

export default async function SuccessionInquiriesPage() {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // 사용자 정보 가져오기
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!user || !user.approved) {
    redirect('/auth/pending')
  }

  // admin만 접근 가능
  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  // 승계문의 가져오기
  const { data: inquiries } = await supabase
    .from('succession_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900">승계문의</h1>
          <p className="text-gray-600 mt-1">승계 관련 문의를 관리하세요 (관리자 전용)</p>
        </div>

        {/* 문의 테이블 */}
        <SuccessionInquiriesTable
          inquiries={inquiries || []}
          userId={user.id}
          userName={user.name}
        />
      </div>
    </DashboardLayout>
  )
}
