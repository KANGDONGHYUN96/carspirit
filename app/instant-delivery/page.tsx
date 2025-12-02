import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InstantDeliveryTable from '@/components/instant-delivery/instant-delivery-table'

// 캐시 비활성화 - 항상 최신 데이터 가져오기
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // 즉시출고 차량 목록 가져오기 (전체 데이터 - 페이지네이션으로 전부 가져오기)
  let allVehicles: any[] = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('instant_delivery_vehicles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.log('에러:', error)
      break
    }

    if (!data || data.length === 0) {
      break
    }

    allVehicles = [...allVehicles, ...data]
    from += pageSize

    if (data.length < pageSize) {
      break
    }
  }

  const vehicles = allVehicles

  // 디버깅: 콘솔에 데이터 확인
  console.log('=== 즉시출고 데이터 조회 ===')
  console.log('데이터 개수:', vehicles?.length || 0)

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
