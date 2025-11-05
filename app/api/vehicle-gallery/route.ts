import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'

// POST: 새 차량 갤러리 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { brand, model, exterior_color, interior_color, options, thumbnail_url, zip_file_url } = body

    if (!brand || !model || !thumbnail_url || !zip_file_url) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicle_gallery')
      .insert({
        user_id: user.id,
        user_name: user.name,
        brand,
        model,
        exterior_color: exterior_color || null,
        interior_color: interior_color || null,
        options: options || null,
        thumbnail_url,
        zip_file_url,
      })
      .select()
      .single()

    if (error) {
      console.error('차량 갤러리 생성 실패:', error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('차량 갤러리 생성 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: 차량 갤러리 삭제
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const supabase = await createClient()

    // 권한 확인: 본인 또는 관리자만 삭제 가능
    const { data: item, error: fetchError } = await supabase
      .from('vehicle_gallery')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다' }, { status: 404 })
    }

    const isOwner = item.user_id === user.id
    const isAdmin = user.role === 'admin' || user.role === 'manager'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 삭제
    const { error: deleteError } = await supabase
      .from('vehicle_gallery')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('차량 갤러리 삭제 실패:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('차량 갤러리 삭제 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
