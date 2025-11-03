import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, fileId } = await params

    // 파일 정보 먼저 가져오기
    const { data: file, error: fetchError } = await supabase
      .from('company_files')
      .select('file_url, company_id')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 })
    }

    // 권한 확인
    if (file.company_id !== id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // Storage에서 파일 경로 추출
    const url = new URL(file.file_url)
    const pathParts = url.pathname.split('/company-files/')
    if (pathParts.length < 2) {
      return NextResponse.json({ error: '잘못된 파일 경로입니다' }, { status: 400 })
    }
    const filePath = pathParts[1]

    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from('company-files')
      .remove([filePath])

    if (storageError) {
      console.error('Storage 삭제 실패:', storageError)
    }

    // 데이터베이스에서 파일 레코드 삭제
    const { error: dbError } = await supabase
      .from('company_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      throw dbError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('파일 삭제 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
