import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import VehicleDetailClient from './vehicle-detail-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ model: string }>
}

export default async function VehicleDetailPage({ params }: PageProps) {
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

  const { model } = await params
  const decodedModel = decodeURIComponent(model)

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <VehicleDetailClient modelName={decodedModel} />
        </Suspense>
      </main>
    </DashboardLayout>
  )
}
