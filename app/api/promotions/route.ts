import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 프로모션 목록 조회
export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 프로모션 생성
export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
