import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    // 사용자 정보 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user || !user.approved) {
      return NextResponse.json({ error: '승인되지 않은 사용자입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { customer_name, customer_phone, content, status, user_id, assigned_to_name, source } = body

    // 필수 필드 검증
    if (!customer_name || !customer_phone || !content) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    // 문의 생성
    const now = new Date()
    const unlockAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        user_id: user_id,
        customer_name,
        customer_phone,
        content,
        status: status || '신규',
        assigned_to_name: assigned_to_name,
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
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
