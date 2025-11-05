'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inquiry } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CustomAlert from '@/components/common/custom-alert'
import CustomConfirm from '@/components/common/custom-confirm'

interface InquiryDetailModalProps {
  inquiry: Inquiry
  onClose: () => void
  userId: string
  userName: string
  userRole: string
}

interface Memo {
  id: string
  user_name: string
  content: string
  created_at: string
}

export default function InquiryDetailModal({
  inquiry,
  onClose,
  userId,
  userName,
  userRole
}: InquiryDetailModalProps) {
  const [status, setStatus] = useState(inquiry.status)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [memos, setMemos] = useState<Memo[]>([])
  const [newMemo, setNewMemo] = useState('')
  const [isLoadingMemos, setIsLoadingMemos] = useState(true)
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

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

  // 상태 저장
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('inquiries')
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

  // 잠금 해제 (7일 연장)
  const handleLock = async () => {
    const isAdmin = userRole === 'admin'

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

      const todayLockCount = todayLocks?.length || 0
      if (todayLockCount >= 2) {
        setAlert({ message: '하루에 최대 2개까지만 잠금할 수 있습니다.', type: 'warning' })
        return
      }
    }

    setConfirm({
      message: '이 문의를 7일 연장하시겠습니까?',
      onConfirm: async () => {
        setConfirm(null)
        setIsLocking(true)
        try {
          const now = new Date()

          // 기존 unlock_at이 있으면 그 시간에 +7일, 없으면 현재 시간 + 7일
          let unlockAt: Date
          if (inquiry.unlock_at) {
            const currentUnlockAt = new Date(inquiry.unlock_at)
            unlockAt = new Date(currentUnlockAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 기존 unlock_at + 7일
          } else {
            unlockAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 현재 시간 + 7일
          }

          // 이미 잠금된 문의인지 확인
          const isAlreadyLocked = inquiry.locked_by === userId && inquiry.locked_at

          const updateData: any = {
            unlock_at: unlockAt.toISOString(),
          }

          // 처음 잠그는 경우에만 locked_at과 locked_by 업데이트
          if (!isAlreadyLocked) {
            updateData.locked_at = now.toISOString()
            updateData.locked_by = userId
          }

          const { error } = await supabase
            .from('inquiries')
            .update(updateData)
            .eq('id', inquiry.id)

          if (error) throw error

          setAlert({ message: '7일 연장되었습니다', type: 'success' })
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
            </div>
          </div>

          {/* 문의 내용 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">문의 내용</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-line">{inquiry.content}</p>
            </div>
          </div>

          {/* 상태 변경 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상태</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setStatus('신규')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '신규'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                신규
              </button>
              <button
                onClick={() => setStatus('관리')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '관리'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                관리
              </button>
              <button
                onClick={() => setStatus('부재')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '부재'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                부재
              </button>
              <button
                onClick={() => setStatus('심사')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '심사'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                심사
              </button>
              <button
                onClick={() => setStatus('가망')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '가망'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                가망
              </button>
              <button
                onClick={() => setStatus('계약')}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  status === '계약'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                계약
              </button>
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
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={handleLock}
            disabled={isLocking}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLocking ? '처리 중...' : userRole === 'admin' ? '🔒 7일 잠금 (무제한)' : '🔒 7일 잠금'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            닫기
          </button>
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
    </div>
  )
}
