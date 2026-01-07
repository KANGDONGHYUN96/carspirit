import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireManager } from '@/lib/auth/get-user'

// 전략차종 목록 조회 (로그인 필수)
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: vehicles, error } = await supabase
      .from('strategic_vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('전략차종 조회 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 전략차종 생성 (매니저 이상만 가능)
export async function POST(request: NextRequest) {
  try {
    // 매니저 또는 관리자만 전략차종 생성 가능
    await requireManager()
    const supabase = await createClient()

    const body = await request.json()

    const { data, error } = await supabase
      .from('strategic_vehicles')
      .insert(body)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('전략차종 생성 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }
    if (error.message === 'Manager access required') {
      return NextResponse.json({ error: '매니저 이상 권한이 필요합니다' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
