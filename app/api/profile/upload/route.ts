import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-user'

// 허용된 이미지 타입
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // 로그인 + 승인된 사용자만 가능
    const currentUser = await requireAuth()
    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile' | 'card'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    // 파일 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: '허용되지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 가능)'
      }, { status: 400 })
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: '파일 크기가 너무 큽니다 (최대 5MB)'
      }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'

    // Storage에 업로드 (UUID로 저장)
    const uniqueId = crypto.randomUUID()
    const folder = type === 'card' ? 'business-cards' : 'profile-images'
    const filePath = `${folder}/${currentUser.auth_user_id}/${uniqueId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,  // upsert false로 변경 (보안)
      })

    if (uploadError) {
      console.error('Storage 업로드 실패:', uploadError)
      throw uploadError
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath)

    // users 테이블 업데이트 (현재 로그인 사용자 ID 사용)
    const updateField = type === 'card' ? 'business_card_url' : 'profile_image_url'
    const { error: dbError } = await supabase
      .from('users')
      .update({ [updateField]: publicUrl })
      .eq('id', currentUser.id)

    if (dbError) {
      console.error('DB 업데이트 실패:', dbError)
      throw dbError
    }

    return NextResponse.json({
      [type === 'card' ? 'business_card_url' : 'profile_image_url']: publicUrl
    })
  } catch (error: any) {
    console.error('파일 업로드 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
