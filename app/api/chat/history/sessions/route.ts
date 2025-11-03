import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 사용자의 모든 채팅 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 사용자의 모든 세션 가져오기 (세션별로 첫 메시지와 마지막 메시지 시간)
    const { data, error } = await supabase
      .from('chat_history')
      .select('session_id, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // 세션별로 그룹화
    const sessionsMap = new Map()
    data?.forEach((record: any) => {
      if (!sessionsMap.has(record.session_id)) {
        sessionsMap.set(record.session_id, {
          session_id: record.session_id,
          first_message: record.message,
          last_activity: record.created_at,
          message_count: 1
        })
      } else {
        const session = sessionsMap.get(record.session_id)
        session.message_count += 1
      }
    })

    const sessions = Array.from(sessionsMap.values())

    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error('세션 목록 조회 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
