import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/dashboard-layout'
import ChatHistoryClient from '@/components/chatbot/chat-history-client'

export default async function ChatHistoryPage() {
  const supabase = await createClient()

  // 현재 사용자 정보
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">채팅 기록</h1>
            <p className="text-gray-600">로그인이 필요합니다.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // 사용자의 채팅 세션 목록 가져오기
  const { data: chatData } = await supabase
    .from('chat_history')
    .select('session_id, message, created_at, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 세션별로 그룹화
  const sessionsMap = new Map()
  chatData?.forEach((record: any) => {
    if (!sessionsMap.has(record.session_id)) {
      sessionsMap.set(record.session_id, {
        session_id: record.session_id,
        first_message: record.role === 'user' ? record.message : '대화 시작',
        last_activity: record.created_at,
        message_count: 1
      })
    } else {
      const session = sessionsMap.get(record.session_id)
      session.message_count += 1
    }
  })

  const sessions = Array.from(sessionsMap.values())

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">📝 채팅 기록</h1>
            <p className="text-gray-600 mt-2">과거 대화 내역을 확인하세요</p>
          </div>

          <ChatHistoryClient sessions={sessions} />
        </div>
      </div>
    </DashboardLayout>
  )
}
