import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/dashboard-layout'
import PromotionsClient from '@/components/admin/promotions-client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function PromotionsAdminPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: promotions } = await supabase
    .from('capital_promotions')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: companies } = await supabase
    .from('company_details')
    .select('id, company_name, logo_url')
    .order('company_name', { ascending: true })

  return (
    <DashboardLayout>
      <div className="p-6 bg-snow-bg min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">프로모션 관리</h1>
            <p className="text-gray-600 mt-2">캐피탈별 프로모션을 관리하세요</p>
          </div>

          <PromotionsClient promotions={promotions || []} companies={companies || []} />
        </div>
      </div>
    </DashboardLayout>
  )
}
