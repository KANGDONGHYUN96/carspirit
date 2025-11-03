import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop() || 'jpg'

    // Storage에 업로드 (UUID로 저장)
    const uniqueId = crypto.randomUUID()
    const filePath = `profile-images/${user.id}/${uniqueId}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage 업로드 실패:', uploadError)
      throw uploadError
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath)

    // users 테이블에 프로필 이미지 URL 업데이트
    const { error: dbError } = await supabase
      .from('users')
      .update({ profile_image_url: publicUrl })
      .eq('id', user.id)

    if (dbError) {
      console.error('DB 업데이트 실패:', dbError)
      throw dbError
    }

    return NextResponse.json({ profile_image_url: publicUrl })
  } catch (error: any) {
    console.error('프로필 사진 업로드 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
