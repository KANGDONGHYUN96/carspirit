import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 채팅 기록 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { session_id, role, message, mentioned_companies, mentioned_files } = body

    if (!session_id || !role || !message) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: user?.id || null,
        session_id,
        role,
        message,
        mentioned_companies: mentioned_companies || [],
        mentioned_files: mentioned_files || []
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('채팅 기록 저장 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 채팅 기록 조회 (특정 세션)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json({ error: 'session_id가 필요합니다' }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('채팅 기록 조회 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
