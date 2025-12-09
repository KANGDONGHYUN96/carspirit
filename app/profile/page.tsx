import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/dashboard-layout'
import ProfileClient from '@/components/profile/profile-client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <ProfileClient user={user} />
        </div>
      </div>
    </DashboardLayout>
  )
}
