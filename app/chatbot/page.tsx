import DashboardLayout from '@/components/layout/dashboard-layout'
import ChatInterface from '@/components/chatbot/chat-interface'
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function ChatbotPage() {
  const user = await getCurrentUser()

  return (
    <DashboardLayout>
      <div className="bg-snow-bg min-h-screen">
        {/* 챗봇 인터페이스 */}
        <ChatInterface userProfileImage={user?.profile_image_url || null} userName={user?.name || 'User'} />
      </div>
    </DashboardLayout>
  )
}
