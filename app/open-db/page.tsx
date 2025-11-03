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

  // 오픈DB 문의 가져오기
  // 모든 사용자의 문의를 가져옴 (user_id 필터 없음)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  // 필터링: 7일 지났고 잠금되지 않은 것만
  const openInquiries = (inquiries || []).filter(inquiry => {
    const createdAt = new Date(inquiry.created_at)
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    // 잠금된 문의는 무조건 숨김 (본인 것이든 타인 것이든)
    if (inquiry.locked_at && inquiry.locked_by) {
      const lockedAt = new Date(inquiry.locked_at)
      const daysSinceLocked = (Date.now() - lockedAt.getTime()) / (1000 * 60 * 60 * 24)

      // 잠금이 7일 지났으면 공개
      if (daysSinceLocked >= 7) return true

      // 7일 안 지났으면 숨김 (본인/타인 상관없이)
      return false
    }

    // 잠금 안 되어 있고 7일 지났으면 공개
    if (daysSinceCreated >= 7) return true

    // 7일 안 지났으면 숨김
    return false
  })

  // 오늘 본인이 잠금한 개수 확인
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayLocks } = await supabase
    .from('inquiries')
    .select('id')
    .eq('locked_by', user.id)
    .gte('locked_at', today.toISOString())

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
          inquiries={openInquiries}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
          todayLockCount={todayLockCount}
        />
      </div>
    </DashboardLayout>
  )
}
