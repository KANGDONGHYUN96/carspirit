import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-user'

export async function POST(request: Request) {
  try {
    // 로그인 + 승인된 사용자만 가능
    const currentUser = await requireAuth()
    const supabase = await createClient()

    const body = await request.json()
    const { customer_name, customer_phone, content, status, assigned_to_name, source } = body

    // 필수 필드 검증
    if (!customer_name || !customer_phone || !content) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    // 문의 생성 - user_id는 클라이언트에서 받지 않고 현재 로그인 사용자 사용
    const now = new Date()
    const unlockAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        user_id: currentUser.id,  // 현재 로그인한 사용자의 ID 사용
        customer_name,
        customer_phone,
        content,
        status: status || '신규',
        assigned_to_name: assigned_to_name || currentUser.name,
        source: source || '카스피릿',
        unlock_at: unlockAt.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('문의 생성 오류:', error)
      return NextResponse.json({ error: '문의 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inquiry }, { status: 201 })
  } catch (error: any) {
    console.error('API 오류:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
