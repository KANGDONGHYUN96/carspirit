import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InquiriesTable from '@/components/inquiries/inquiries-table'

export default async function InquiriesPage() {
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

  // 나의 문의 가져오기 (user_id = 본인)
  // 신규 문의 (7일 이내) + 내가 잠금한 문의
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900">고객관리</h1>
          <p className="text-gray-600 mt-1">내 문의를 관리하세요</p>
        </div>

        {/* 문의 테이블 */}
        <InquiriesTable
          inquiries={inquiries || []}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
        />
      </div>
    </DashboardLayout>
  )
}
