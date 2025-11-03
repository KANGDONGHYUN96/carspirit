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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">👤 내 계정</h1>
            <p className="text-gray-600 mt-2">프로필 정보를 관리하세요</p>
          </div>

          <ProfileClient user={user} />
        </div>
      </div>
    </DashboardLayout>
  )
}
