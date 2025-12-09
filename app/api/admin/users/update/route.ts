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

    const {
      userId,
      phone,
      fax,
      admin_memo,
      company,
      position,
      join_date,
      recruiter_number,
      bank_name,
      account_holder,
      account_number
    } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 정보 업데이트
    const { error } = await supabase
      .from('users')
      .update({
        phone: phone || null,
        fax: fax || null,
        admin_memo: admin_memo || null,
        company: company || null,
        position: position || null,
        join_date: join_date || null,
        recruiter_number: recruiter_number || null,
        bank_name: bank_name || null,
        account_holder: account_holder || null,
        account_number: account_number || null
      })
      .eq('id', userId)

    if (error) {
      console.error('사용자 정보 업데이트 실패:', error)
      return NextResponse.json(
        { error: '사용자 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
