'use client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface MessageBubbleProps {
  message: Message
  userProfileImage: string | null
  userName: string
}

export default function MessageBubble({ message, userProfileImage, userName }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 아바타 */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-700 overflow-hidden">
          {userProfileImage ? (
            <img
              src={userProfileImage}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm">👤</span>
          )}
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
          isUser
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  )
}
