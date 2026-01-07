import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-user'

// 채팅 기록 저장
export async function POST(request: NextRequest) {
  try {
    // 로그인 필수
    const currentUser = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    const { session_id, role, message, mentioned_companies, mentioned_files } = body

    if (!session_id || !role || !message) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: currentUser.id,
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
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 채팅 기록 조회 (특정 세션) - 본인 채팅만 조회 가능
export async function GET(request: NextRequest) {
  try {
    // 로그인 필수
    const currentUser = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json({ error: 'session_id가 필요합니다' }, { status: 400 })
    }

    // 본인의 채팅 기록만 조회 가능
    const { data: messages, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('채팅 기록 조회 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
