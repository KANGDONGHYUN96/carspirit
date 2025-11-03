'use client'

import { useState } from 'react'

interface Session {
  session_id: string
  first_message: string
  last_activity: string
  message_count: number
}

interface Message {
  role: 'user' | 'assistant'
  message: string
  created_at: string
  mentioned_companies?: any[]
  mentioned_files?: any[]
}

interface ChatHistoryClientProps {
  sessions: Session[]
}

export default function ChatHistoryClient({ sessions }: ChatHistoryClientProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadSession = async (sessionId: string) => {
    setIsLoading(true)
    setSelectedSession(sessionId)

    try {
      const response = await fetch(`/api/chat/history?session_id=${sessionId}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        console.error('세션 로드 실패:', data.error)
      }
    } catch (error) {
      console.error('세션 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 세션 목록 */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">대화 목록</h2>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              아직 채팅 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => loadSession(session.session_id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSession === session.session_id
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {session.first_message}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{session.message_count}개 메시지</span>
                    <span>{new Date(session.last_activity).toLocaleDateString('ko-KR')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메시지 내역 */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {!selectedSession ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">왼쪽에서 대화를 선택하세요</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16 text-gray-400">
              <p>로딩 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">대화 내용</h2>

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* 아바타 */}
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-700">
                      <span className="text-white text-sm">👤</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-black border border-gray-300">
                      <img
                        src="/carspirit-logo.png"
                        alt="CarSpirit"
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  )}

                  {/* 메시지 */}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {msg.message}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        msg.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
