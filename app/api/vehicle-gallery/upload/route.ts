import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'thumbnail' | 'zip'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    if (!type || (type !== 'thumbnail' && type !== 'zip')) {
      return NextResponse.json({ error: '파일 타입이 유효하지 않습니다' }, { status: 400 })
    }

    // 파일 확장자 검증
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (type === 'thumbnail' && !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '')) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다' }, { status: 400 })
    }

    if (type === 'zip' && fileExt !== 'zip') {
      return NextResponse.json({ error: 'ZIP 파일만 업로드 가능합니다' }, { status: 400 })
    }

    // Storage에 업로드
    const supabase = await createClient()
    const uniqueId = crypto.randomUUID()
    const folder = type === 'thumbnail' ? 'vehicle-thumbnails' : 'vehicle-zips'
    const filePath = `${folder}/${user.id}/${uniqueId}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError)
      throw uploadError
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('파일 업로드 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
