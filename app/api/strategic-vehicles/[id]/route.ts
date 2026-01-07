import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireManager } from '@/lib/auth/get-user'

// 전략차종 수정 (매니저 이상만 가능)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager()
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    const { data, error } = await supabase
      .from('strategic_vehicles')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('전략차종 수정 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }
    if (error.message === 'Manager access required') {
      return NextResponse.json({ error: '매니저 이상 권한이 필요합니다' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 전략차종 삭제 (매니저 이상만 가능)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager()
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('strategic_vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('전략차종 삭제 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }
    if (error.message === 'Manager access required') {
      return NextResponse.json({ error: '매니저 이상 권한이 필요합니다' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
