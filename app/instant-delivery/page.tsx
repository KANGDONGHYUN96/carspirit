import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InstantDeliveryClient from './instant-delivery-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: '즉시출고 | 카스피릿',
  description: '즉시출고 가능한 차량을 확인하세요'
}

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

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">즉시출고</h1>
            <p className="mt-2 text-gray-600">바로 출고 가능한 차량을 확인하세요</p>
          </div>

          {/* 클라이언트 컴포넌트 (useSearchParams → Suspense 필요) */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <InstantDeliveryClient />
          </Suspense>
        </div>
      </main>
    </DashboardLayout>
  )
}
