import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/dashboard-layout'
import ContractsClient from '@/components/contracts/contracts-client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function ContractsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // 관리자/매니저는 모든 계약 조회, 영업자는 본인 계약만 조회
  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin'

  let query = supabase
    .from('contracts')
    .select('*')

  // 영업자는 본인이 생성한 계약만 조회
  if (!isManagerOrAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { data: contracts } = await query.order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[95%] mx-auto">
          <ContractsClient contracts={contracts || []} userName={user.name} />
        </div>
      </div>
    </DashboardLayout>
  )
}
