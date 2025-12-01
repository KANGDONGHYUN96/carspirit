import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 계약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ contracts })
  } catch (error: any) {
    console.error('계약 조회 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 계약 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // auth_user_id로 users 테이블에서 실제 user.id 조회
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        ...body,
        user_id: dbUser.id,
        created_by: dbUser.id
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('계약 생성 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
