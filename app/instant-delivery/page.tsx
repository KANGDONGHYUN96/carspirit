import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InstantDeliveryTable from '@/components/instant-delivery/instant-delivery-table'

export default async function InstantDeliveryPage() {
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

  // 즉시출고 차량 목록 가져오기
  const { data: vehicles } = await supabase
    .from('instant_delivery_vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-snow-bg p-6">
        {/* 헤더 */}
        <div className="mt-8 mb-6 px-10">
          <h1 className="text-3xl font-bold text-gray-900">즉시출고 차량리스트</h1>
          <p className="text-gray-600 mt-1">빠르게 출고 가능한 차량을 확인하세요</p>
        </div>

        {/* 테이블 */}
        <InstantDeliveryTable vehicles={vehicles || []} />
      </div>
    </DashboardLayout>
  )
}
