import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import Sidebar from './sidebar'
import Header from './header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!user.approved) {
    redirect('/auth/pending')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-snow-bg">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-snow-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
