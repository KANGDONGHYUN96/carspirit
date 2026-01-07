import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/get-user'

// 프로모션 목록 조회 (로그인 필수)
export async function GET(request: NextRequest) {
  try {
    // 로그인 + 승인된 사용자만 조회 가능
    await requireAuth()

    const supabase = await createClient()

    const { data: promotions, error } = await supabase
      .from('capital_promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ promotions })
  } catch (error: any) {
    console.error('프로모션 조회 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 프로모션 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 관리자만 프로모션 생성 가능
    await requireAdmin()

    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('capital_promotions')
      .insert(body)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('프로모션 생성 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
