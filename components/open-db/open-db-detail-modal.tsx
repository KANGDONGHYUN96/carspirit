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
        .select('id')
        .eq('locked_by', userId)
        .gte('locked_at', today.toISOString())

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
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">문의 상세</h2>
            <p className="text-sm text-gray-500 mt-1">
              등록일: {new Date(inquiry.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 고객 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">고객 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">매체</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.source || '카스피릿'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">고객명</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">번호</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.customer_phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">담당자</p>
                <p className="text-sm font-medium text-gray-900">{inquiry.assigned_to_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">문의 내용</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-line">{inquiry.content}</p>
            </div>
          </div>

          {/* 메모 목록 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상담 메모</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
              {isLoadingMemos ? (
                <p className="text-sm text-gray-500 text-center py-4">메모 로딩 중...</p>
              ) : memos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">작성된 메모가 없습니다</p>
              ) : (
                memos.map((memo) => (
                  <div key={memo.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-line mb-2">{memo.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-blue-600">{memo.user_name}</span>
                      <span>•</span>
                      <span>{formatDateTime(memo.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 메모 작성 */}
            <div className="mt-3">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="새 메모를 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSaveMemo}
                className="mt-2 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                메모 추가
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleLock}
            disabled={isLocking}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLocking ? '처리 중...' : isAdmin ? '🔒 잠금 (무제한)' : `🔒 잠금 (${todayLockCount}/2)`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
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
