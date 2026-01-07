import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/get-user'

// 허용된 파일 타입
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
]

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// 파일 목록 조회 (로그인 필수)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data: files, error } = await supabase
      .from('company_files')
      .select('*')
      .eq('company_id', id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('파일 목록 조회 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 파일 업로드 (로그인 필수 + 파일 검증)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    // 파일 검증
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json({
          error: `허용되지 않는 파일 형식입니다: ${file.name}`
        }, { status: 400 })
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          error: `파일 크기가 너무 큽니다 (최대 10MB): ${file.name}`
        }, { status: 400 })
      }
    }

    // 업체 정보 가져오기
    const { data: company } = await supabase
      .from('company_details')
      .select('company_name')
      .eq('id', id)
      .single()

    if (!company) {
      return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const fileBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(fileBuffer)

      // 파일 확장자 추출
      const fileExt = file.name.split('.').pop() || ''

      // Storage에는 UUID로 저장 (한글 문제 해결)
      const uniqueId = crypto.randomUUID()
      const safeCompanyName = company.company_name.replace(/[^a-zA-Z0-9]/g, '_')
      const filePath = `companies/${safeCompanyName}/${uniqueId}.${fileExt}`

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage 업로드 실패:', uploadError)
        throw uploadError
      }

      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(filePath)

      // 데이터베이스에 파일 정보 저장
      const { data: fileRecord, error: dbError } = await supabase
        .from('company_files')
        .insert({
          company_id: id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) {
        console.error('DB 저장 실패:', dbError)
        throw dbError
      }

      uploadedFiles.push(fileRecord)
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error: any) {
    console.error('파일 업로드 실패:', error)
    if (error.message === 'Unauthorized' || error.message === 'User not approved') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
