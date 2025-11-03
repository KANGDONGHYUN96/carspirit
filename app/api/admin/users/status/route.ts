import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    // 관리자 권한 확인
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { userId, approved } = await request.json()

    if (!userId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 승인 상태 업데이트
    const { error } = await supabase
      .from('users')
      .update({ approved })
      .eq('id', userId)

    if (error) {
      console.error('상태 업데이트 실패:', error)
      return NextResponse.json(
        { error: '상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('사용자 상태 변경 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
