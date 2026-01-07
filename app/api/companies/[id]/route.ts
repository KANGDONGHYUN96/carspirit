import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/get-user'

// 허용된 업데이트 필드 (Mass Assignment 방지)
const ALLOWED_UPDATE_FIELDS = [
  'company_name', 'representative', 'business_number', 'phone', 'fax',
  'email', 'address', 'website', 'description', 'logo_url', 'notes'
]

// 업체 정보 조회 (로그인 필수)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('company_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('API error:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 업체 정보 수정 (로그인 필수 + 필드 검증)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    // 허용된 필드만 필터링 (Mass Assignment 방지)
    const sanitizedBody: Record<string, any> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_UPDATE_FIELDS.includes(key)) {
        sanitizedBody[key] = body[key]
      }
    }

    if (Object.keys(sanitizedBody).length === 0) {
      return NextResponse.json({ error: '업데이트할 필드가 없습니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('company_details')
      .update(sanitizedBody)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('API error:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
