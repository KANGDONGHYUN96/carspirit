import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/dashboard-layout'
import StrategicVehiclesClient from '@/components/strategic-vehicles/strategic-vehicles-client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function StrategicVehiclesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('strategic_vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: companies } = await supabase
    .from('company_details')
    .select('id, company_name, logo_url')
    .order('company_name', { ascending: true })

  return (
    <DashboardLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-[95%] mx-auto">
          <StrategicVehiclesClient vehicles={vehicles || []} companies={companies || []} />
        </div>
      </div>
    </DashboardLayout>
  )
}
