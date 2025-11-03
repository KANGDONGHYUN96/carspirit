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

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['admin', 'manager', 'salesperson'].includes(role)) {
      return NextResponse.json(
        { error: '잘못된 역할입니다.' },
        { status: 400 }
      )
    }

    // 자기 자신의 역할은 변경할 수 없음
    if (userId === user.id) {
      return NextResponse.json(
        { error: '본인의 역할은 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 역할 업데이트
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('역할 업데이트 실패:', error)
      return NextResponse.json(
        { error: '역할 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('사용자 역할 변경 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
