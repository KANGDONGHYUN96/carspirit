'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inquiry } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

interface OpenDBDetailModalProps {
  inquiry: Inquiry
  onClose: () => void
  userId: string
  userName: string
  userRole: string
  todayLockCount: number
}

interface Memo {
  id: string
  user_name: string
  content: string
  created_at: string
}

export default function OpenDBDetailModal({
  inquiry,
  onClose,
  userId,
  userName,
  userRole,
  todayLockCount
}: OpenDBDetailModalProps) {
  const [isLocking, setIsLocking] = useState(false)
  const [memos, setMemos] = useState<Memo[]>([])
  const [newMemo, setNewMemo] = useState('')
  const [isLoadingMemos, setIsLoadingMemos] = useState(true)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isLocked = inquiry.locked_by && inquiry.locked_at
  const isMyLock = inquiry.locked_by === userId
  const isAdmin = userRole === 'admin'

  // 메모 불러오기
  useEffect(() => {
    loadMemos()
  }, [inquiry.id])

  const loadMemos = async () => {
    setIsLoadingMemos(true)
    try {
      const { data, error } = await supabase
        .from('inquiry_memos')
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
        .from('inquiry_memos')
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

  // 잠금 처리
  const handleLock = async () => {
    if (!isAdmin) {
      // 일반 사용자: 오늘 잠금 횟수 확인
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayLocks, error: countError } = await supabase
        .from('inquiries')
        .select('id, locked_at')
        .eq('locked_by', userId)
        .gte('locked_at', today.toISOString())
        .not('locked_at', 'is', null)

      if (countError) {
        console.error('잠금 횟수 확인 에러:', countError)
        setAlert({ message: '잠금 횟수 확인 실패', type: 'error' })
        return
      }

      const currentLockCount = todayLocks?.length || 0
      if (currentLockCount >= 2) {
        setAlert({ message: '하루에 최대 2개까지만 잠금할 수 있습니다.', type: 'warning' })
        return
      }
    }

    setConfirm({
      message: '이 문의를 7일간 잠금하시겠습니까?',
      onConfirm: async () => {
        setConfirm(null)
        setIsLocking(true)
        try {
          const now = new Date()
          const unlockAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후

          // 잠금 시 user_id와 assigned_to_name도 함께 변경 (나의문의에 보이게 하기 위함)
          const { error } = await supabase
            .from('inquiries')
            .update({
              locked_at: now.toISOString(),
              locked_by: userId,
              user_id: userId, // 중요: user_id를 변경해야 나의문의에 보임
              assigned_to: userId, // 담당자 지정
              assigned_to_name: userName, // 담당자 이름 설정
              unlock_at: unlockAt.toISOString(),
            })
            .eq('id', inquiry.id)

          if (error) {
            console.error('Supabase error:', error)
            throw error
          }

          setAlert({ message: '문의가 잠금되었습니다. 나의문의에서 확인할 수 있습니다.', type: 'success' })
          router.refresh()
          onClose()
        } catch (error) {
          console.error('Lock error:', error)
          setAlert({ message: '잠금 실패: ' + (error as Error).message, type: 'error' })
          setIsLocking(false)
        }
      }
    })
  }

  // 시간 포맷팅 (년,월,일,시,분,초)
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
    <>
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
            {/* 고객 정보 */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">고객 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 w-16">매체</span>
                  <span className="text-sm font-medium text-gray-900">{isAdmin ? (inquiry.source || '카스피릿') : '카스피릿'}</span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 w-16">고객명</span>
                  <span className="text-sm font-semibold text-gray-900">{inquiry.customer_name}</span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 w-16">연락처</span>
                  <span className="text-sm font-medium text-gray-900">{inquiry.customer_phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 w-16">담당자</span>
                  <span className="text-sm font-medium text-gray-900">{inquiry.assigned_to_name || '-'}</span>
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
                        <span className="text-gray-300">•</span>
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
                onClick={handleLock}
                disabled={isLocking}
                className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-400 text-white rounded-lg transition-all"
              >
                {isLocking ? '처리중' : isAdmin ? '잠금' : `잠금 (${todayLockCount}/2)`}
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
      </div>

    {/* Custom Alert Modal */}
    <CustomAlert
      isOpen={alert !== null}
      message={alert?.message || ''}
      type={alert?.type}
      onClose={() => setAlert(null)}
    />

    {/* Custom Confirm Modal */}
    <CustomConfirm
      isOpen={confirm !== null}
      message={confirm?.message || ''}
      onConfirm={() => {
        if (confirm?.onConfirm) {
          confirm.onConfirm()
        }
      }}
      onCancel={() => setConfirm(null)}
      type="warning"
    />
  </>
  )
}
