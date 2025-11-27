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

  // unlock_at이 지난 문의의 user_id를 NULL로 자동 전환 (오픈DB로 이동)
  const now = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // 1. unlock_at이 설정된 문의 중 기간이 지난 것
  await supabase
    .from('inquiries')
    .update({
      user_id: null,
      updated_at: now.toISOString()
    })
    .eq('user_id', user.id)
    .not('unlock_at', 'is', null)
    .lt('unlock_at', now.toISOString())

  // 2. unlock_at이 NULL인 문의 중 created_at이 7일 이상 지난 것 (기존 데이터 처리)
  await supabase
    .from('inquiries')
    .update({
      user_id: null,
      updated_at: now.toISOString()
    })
    .eq('user_id', user.id)
    .is('unlock_at', null)
    .lt('created_at', sevenDaysAgo.toISOString())

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
