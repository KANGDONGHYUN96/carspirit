'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CompanyCardResult from './company-card-result'
import CompanyDetailModalEditable from '../dashboard/company-detail-modal-editable'

interface Message {
  role: 'user' | 'assistant'
  content: string
  mentionedCompanies?: {
    id: string
    company_name: string
    logo_url: string | null
    product_types: string[]
  }[]
  mentionedFiles?: {
    id: string
    file_name: string
    file_url: string
    file_type: string
    company_name: string
  }[]
}

interface ChatInterfaceProps {
  userProfileImage: string | null
  userName: string
}

// 타이핑 효과 컴포넌트
function TypingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 20) // 20ms마다 한 글자씩
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, onComplete])

  return <span className="whitespace-pre-wrap">{displayedText}</span>
}

export default function ChatInterface({ userProfileImage, userName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 채팅 기록 저장
  const saveMessage = async (message: Message) => {
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          role: message.role,
          message: message.content,
          mentioned_companies: message.mentionedCompanies || [],
          mentioned_files: message.mentionedFiles || []
        })
      })
    } catch (error) {
      console.error('채팅 저장 실패:', error)
    }
  }

  // 업체 상세 정보 가져오기
  const handleCompanyClick = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`)
      const data = await response.json()

      if (response.ok && data.data) {
        setSelectedCompany(data.data)
      }
    } catch (error) {
      console.error('업체 정보 로드 실패:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent, initialMessage?: string) => {
    e.preventDefault()

    const messageToSend = initialMessage || input.trim()
    if (!messageToSend || isLoading) return

    // 인트로 화면 숨기기
    if (showIntro) {
      setShowIntro(false)
    }

    const userMessage: Message = {
      role: 'user',
      content: messageToSend
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 사용자 메시지 저장
    saveMessage(userMessage)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '응답 실패')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        mentionedCompanies: data.mentionedCompanies,
        mentionedFiles: data.mentionedFiles
      }

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage]
        setTypingMessageIndex(newMessages.length - 1)
        return newMessages
      })

      // AI 응답 저장
      saveMessage(assistantMessage)
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `오류가 발생했습니다: ${error.message}`
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 인트로 화면
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl font-bold text-gray-800 mb-12"
        >
          지금 무슨 생각을 하시나요?
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-3xl"
        >
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="무엇이든 물어보세요"
              className="w-full px-6 py-4 pr-14 bg-white border-2 border-gray-200 rounded-full placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full transition-all disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-sm text-gray-500"
        >
          예: "만21세 진행 가능한 곳은?", "BNK 전기차 서류 줘", "외국인 진행 가능한 업체 알려줘"
        </motion.div>
      </motion.div>
    )
  }

  // 채팅 화면
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-snow-bg">
        <div className="max-w-5xl mx-auto w-full space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 메시지 카드 */}
              <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* 챗봇 메시지: 왼쪽 정렬 */}
                {message.role === 'assistant' && (
                  <>
                    {/* 아바타 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center p-1.5">
                        <img
                          src="/carspirit-logo.png"
                          alt="CarSpirit"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    {/* 메시지 내용 */}
                    <div className="flex-1 max-w-[70%] space-y-2">
                      <div className="text-sm font-semibold text-gray-900">카스피릿</div>
                      <div className="text-gray-800 text-[15px] leading-relaxed">
                          {typingMessageIndex === index ? (
                            <TypingText
                              text={message.content}
                              onComplete={() => setTypingMessageIndex(null)}
                            />
                          ) : (
                            <span className="whitespace-pre-wrap">{message.content}</span>
                          )}
                        </div>

                      {/* 언급된 업체 카드 표시 */}
                      {message.mentionedCompanies && message.mentionedCompanies.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-2 font-medium">관련 업체:</div>
                          <div className="flex flex-wrap gap-3">
                            {message.mentionedCompanies.map((company) => (
                              <CompanyCardResult
                                key={company.id}
                                company={company}
                                onCompanyClick={handleCompanyClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 언급된 파일 다운로드 버튼 표시 */}
                      {message.mentionedFiles && message.mentionedFiles.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-2 font-medium">📎 관련 파일:</div>
                          <div className="space-y-2">
                            {message.mentionedFiles.map((file) => (
                              <a
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors group"
                              >
                                <span className="text-2xl">
                                  {file.file_type.includes('pdf') ? '📄' :
                                   file.file_type.includes('excel') || file.file_type.includes('spreadsheet') ? '📊' :
                                   file.file_type.includes('image') ? '🖼️' : '📎'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                    {file.file_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {file.company_name}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 사용자 메시지: 오른쪽 정렬 */}
                {message.role === 'user' && (
                  <>
                    {/* 메시지 내용 */}
                    <div className="max-w-[70%]">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                        <div className="text-gray-800 text-[15px] leading-relaxed">
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        </div>
                      </div>
                    </div>
                    {/* 아바타 */}
                    <div className="flex-shrink-0 self-end mb-1">
                      {userProfileImage ? (
                        <img
                          src={userProfileImage}
                          alt={userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-lg">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-start"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center p-1.5">
                <img
                  src="/carspirit-logo.png"
                  alt="CarSpirit"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex gap-1 pt-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-300 bg-snow-bg p-4">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="w-full px-5 py-3.5 pr-12 bg-white border-2 border-gray-200 rounded-full placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full transition-all disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* 업체 상세 모달 */}
      {selectedCompany && (
        <CompanyDetailModalEditable
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onUpdate={() => {}}
        />
      )}
    </motion.div>
  )
}
