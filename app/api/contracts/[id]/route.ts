import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 계약 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // auth_user_id로 users 테이블에서 사용자 정보 조회
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 401 })
    }

    const isAdmin = dbUser.role === 'admin' || dbUser.role === 'manager'

    const body = await request.json()
    const { id } = await params

    let query = supabase
      .from('contracts')
      .update(body)
      .eq('id', id)

    // 관리자/매니저가 아닌 경우 본인 계약만 수정 가능
    if (!isAdmin) {
      query = query.eq('created_by', dbUser.id)
    }

    const { data, error } = await query.select().single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('계약 수정 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 계약 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // auth_user_id로 users 테이블에서 사용자 ID 조회
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('created_by', dbUser.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('계약 삭제 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
