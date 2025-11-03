import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 파일 업로드 - 한글 파일명 지원
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
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
      const { data: uploadData, error: uploadError } = await supabase.storage
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
