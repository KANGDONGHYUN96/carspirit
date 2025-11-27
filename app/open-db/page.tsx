import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import OpenDBTable from '@/components/open-db/open-db-table'

export default async function OpenDBPage() {
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

  // unlock_at이 지난 문의의 user_id를 NULL로 자동 전환 (updated_at도 함께 업데이트)
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
    .not('user_id', 'is', null)
    .not('unlock_at', 'is', null)
    .lt('unlock_at', now.toISOString())

  // 2. unlock_at이 NULL인 문의 중 created_at이 7일 이상 지난 것 (기존 데이터 처리)
  await supabase
    .from('inquiries')
    .update({
      user_id: null,
      updated_at: now.toISOString()
    })
    .not('user_id', 'is', null)
    .is('unlock_at', null)
    .lt('created_at', sevenDaysAgo.toISOString())

  // 오픈DB 문의 가져오기 (user_id가 NULL인 것만)
  const { data: openInquiries } = await supabase
    .from('inquiries')
    .select('*')
    .is('user_id', null)
    .order('created_at', { ascending: false })

  // 오늘 본인이 잠금한 개수 확인
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayLocks } = await supabase
    .from('inquiries')
    .select('id, locked_at')
    .eq('locked_by', user.id)
    .gte('locked_at', today.toISOString())
    .not('locked_at', 'is', null)

  const todayLockCount = todayLocks?.length || 0

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900">오픈DB</h1>
          <p className="text-gray-600 mt-1">
            공개된 문의를 조회하고 잠금할 수 있습니다
            {user.role !== 'admin' && (
              <span className="ml-2 text-sm">
                (오늘 잠금: <span className="font-semibold text-blue-600">{todayLockCount}/2</span>)
              </span>
            )}
            {user.role === 'admin' && (
              <span className="ml-2 text-sm text-blue-600 font-semibold">
                (관리자: 무제한 잠금)
              </span>
            )}
          </p>
        </div>

        {/* 오픈DB 테이블 */}
        <OpenDBTable
          inquiries={openInquiries || []}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
          todayLockCount={todayLockCount}
        />
      </div>
    </DashboardLayout>
  )
}
