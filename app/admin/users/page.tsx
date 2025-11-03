import DashboardLayout from '@/components/layout/dashboard-layout'
import UsersTable from '@/components/admin/users-table'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const user = await getCurrentUser()

  // 관리자만 접근 가능
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // 모든 사용자 목록 가져오기
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('Users data:', users)
  console.log('Users error:', error)

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-2">
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-1">
            사용자 승인 및 역할을 관리하세요
          </p>
        </div>

        {/* 사용자 테이블 */}
        <UsersTable users={users || []} currentUserId={user.id} />
      </div>
    </DashboardLayout>
  )
}
