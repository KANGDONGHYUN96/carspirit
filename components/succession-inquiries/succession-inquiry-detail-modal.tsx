'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SuccessionInquiry, InquiryStatus } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'

interface SuccessionInquiryDetailModalProps {
  inquiry: SuccessionInquiry
  onClose: () => void
  userId: string
  userName: string
}

interface Memo {
  id: string
  user_name: string
  content: string
  created_at: string
}

export default function SuccessionInquiryDetailModal({
  inquiry,
  onClose,
  userId,
  userName
}: SuccessionInquiryDetailModalProps) {
  const [status, setStatus] = useState(inquiry.status)
  const [isSaving, setIsSaving] = useState(false)
  const [memos, setMemos] = useState<Memo[]>([])
  const [newMemo, setNewMemo] = useState('')
  const [isLoadingMemos, setIsLoadingMemos] = useState(true)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // 메모 불러오기
  useEffect(() => {
    loadMemos()
  }, [inquiry.id])

  const loadMemos = async () => {
    setIsLoadingMemos(true)
    try {
      const { data, error } = await supabase
        .from('succession_inquiry_memos')
        .select('*')
        .eq('inquiry_id', inquiry.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMemos(data || [])
    } catch (error) {
      console.error('메모 로딩 에러:', error)
    } finally {
      setIsLoadingMemos(false)
    }
  }

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!newMemo.trim()) {
      setAlert({ message: '메모 내용을 입력하세요', type: 'warning' })
      return
    }

    try {
      const { error } = await supabase
        .from('succession_inquiry_memos')
        .insert({
          inquiry_id: inquiry.id,
          user_id: userId,
          user_name: userName,
          content: newMemo.trim(),
        })

      if (error) throw error

      setNewMemo('')
      await loadMemos()
      setAlert({ message: '메모가 저장되었습니다', type: 'success' })
    } catch (error) {
      console.error('메모 저장 에러:', error)
      setAlert({ message: '메모 저장 실패: ' + (error as Error).message, type: 'error' })
    }
  }

  // 상태 저장
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('succession_inquiries')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiry.id)

      if (error) throw error

      setAlert({ message: '저장되었습니다', type: 'success' })
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      setAlert({ message: '저장 실패: ' + (error as Error).message, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // 시간 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-8 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">승계문의</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">문의 상세</h2>
              <p className="text-sm text-gray-400 mt-1 font-light">
                {new Date(inquiry.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-8 py-6 space-y-6">
          {/* 상태 선택 */}
          <div className="flex items-center gap-1.5">
            {[
              { name: '신규', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-100' },
              { name: '관리', color: 'bg-green-500', hoverColor: 'hover:bg-green-100' },
              { name: '부재', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-100' },
              { name: '심사', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-100' },
              { name: '가망', color: 'bg-cyan-500', hoverColor: 'hover:bg-cyan-100' },
              { name: '계약', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-100' },
            ].map((s) => (
              <button
                key={s.name}
                onClick={() => setStatus(s.name as InquiryStatus)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  status === s.name
                    ? `${s.color} text-white`
                    : `bg-gray-100 text-gray-600 ${s.hoverColor}`
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* 고객 정보 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">고객 정보</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">출처</span>
                <span className="text-sm font-medium text-gray-900">{inquiry.source || '승계'}</span>
              </div>
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">고객명</span>
                <span className="text-sm font-semibold text-gray-900">{inquiry.customer_name}</span>
              </div>
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 w-16">연락처</span>
                <span className="text-sm font-medium text-gray-900">{inquiry.customer_phone || '-'}</span>
              </div>
            </div>
          </section>

          {/* 문의 내용 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">문의 내용</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{inquiry.content}</p>
            </div>
          </section>

          {/* 메모 목록 */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">상담 메모</h3>
            <div className="bg-gray-50 rounded-xl p-5 max-h-60 overflow-y-auto space-y-3">
              {isLoadingMemos ? (
                <p className="text-sm text-gray-400 text-center py-6">메모 로딩 중...</p>
              ) : memos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">작성된 메모가 없습니다</p>
              ) : (
                memos.map((memo) => (
                  <div key={memo.id} className="bg-white rounded-lg px-4 py-2.5 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-800 flex-1">{memo.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                      <span className="font-medium text-blue-500">{memo.user_name}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatDateTime(memo.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 메모 작성 */}
            <div className="mt-4">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="새 메모를 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm placeholder:text-gray-400"
              />
              <button
                onClick={handleSaveMemo}
                className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                메모 추가
              </button>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-8 py-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg transition-all"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* Custom Alert Modal */}
      <CustomAlert
        isOpen={alert !== null}
        message={alert?.message || ''}
        type={alert?.type}
        onClose={() => setAlert(null)}
      />
    </div>
  )
}
