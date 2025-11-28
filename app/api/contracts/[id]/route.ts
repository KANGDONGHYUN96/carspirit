import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 계약 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin' || userData?.role === 'manager'

    const body = await request.json()
    const { id } = await params

    let query = supabase
      .from('contracts')
      .update(body)
      .eq('id', id)

    // 관리자/매니저가 아닌 경우 본인 계약만 수정 가능
    if (!isAdmin) {
      query = query.eq('created_by', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('계약 삭제 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
