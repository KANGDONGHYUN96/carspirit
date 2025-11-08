import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 다음 배정 영업자 선택 (최소 할당 우선 방식)
async function getNextRotationUser(supabase: any) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. 활성화된 영업자 목록 가져오기 (오늘 배정 개수 기준 오름차순)
  const { data: rotationUsers, error: rotationError } = await supabase
    .from('user_rotation')
    .select('*')
    .eq('is_active', true)
    .order('today_assigned_count', { ascending: true })
    .order('priority', { ascending: false })
    .limit(1)

  if (rotationError) {
    console.error('user_rotation 조회 에러:', rotationError)
    throw new Error('영업자 배정 실패: ' + rotationError.message)
  }

  if (!rotationUsers || rotationUsers.length === 0) {
    throw new Error('활성화된 영업자가 없습니다')
  }

  const rotationUser = rotationUsers[0]

  // 2. users 테이블에서 영업자 정보 가져오기
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, phone, email')
    .eq('id', rotationUser.user_id)
    .single()

  if (userError || !user) {
    console.error('users 조회 에러:', userError)
    throw new Error('영업자 정보 조회 실패')
  }

  return {
    ...rotationUser,
    user
  }
}

// 로테이션 상태 업데이트
async function updateRotationState(supabase: any, userId: string) {
  // user_rotation 카운트 증가
  const { error: updateError } = await supabase.rpc('increment_rotation_count', {
    p_user_id: userId,
  })

  if (updateError) {
    // RPC 함수가 없으면 직접 UPDATE
    const { data: current } = await supabase
      .from('user_rotation')
      .select('total_assigned_count, today_assigned_count')
      .eq('user_id', userId)
      .single()

    if (current) {
      await supabase
        .from('user_rotation')
        .update({
          total_assigned_count: current.total_assigned_count + 1,
          today_assigned_count: current.today_assigned_count + 1,
          last_assigned_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }
  }

  // rotation_state 업데이트
  await supabase
    .from('rotation_state')
    .update({
      last_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .limit(1)
}

// 카카오톡 알림 발송 (알리고 API)
async function sendKakaoNotification(phone: string, customerName: string, content: string) {
  // 알리고 API 설정이 있을 때만 발송
  const aligoKey = process.env.ALIGO_API_KEY
  const aligoUserId = process.env.ALIGO_USER_ID
  const aligoSender = process.env.ALIGO_SENDER_PHONE

  if (!aligoKey || !aligoUserId || !aligoSender) {
    console.warn('카카오톡 알림 설정이 없습니다. 환경 변수를 확인하세요.')
    return
  }

  try {
    // 전화번호 포맷팅 (하이픈 제거)
    const formattedPhone = phone.replace(/-/g, '')

    const formData = new URLSearchParams()
    formData.append('apikey', aligoKey)
    formData.append('userid', aligoUserId)
    formData.append('sender', aligoSender)
    formData.append('receiver', formattedPhone)
    formData.append('msg', `[카스피릿] 새 문의가 배정되었습니다!\n\n👤 고객: ${customerName}\n📝 내용: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}\n\n지금 바로 확인하세요!`)
    formData.append('msg_type', 'SMS')

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const result = await response.json()

    if (result.result_code !== '1') {
      console.error('카카오톡 알림 발송 실패:', result)
    } else {
      console.log('카카오톡 알림 발송 성공:', result)
    }
  } catch (error) {
    console.error('카카오톡 알림 발송 에러:', error)
    // 알림 실패해도 문의 접수는 계속 진행
  }
}

export async function POST(request: Request) {
  try {
    // API Key 검증 (마케팅 업체용)
    const apiKey = request.headers.get('X-API-Key')
    const validKeys = [
      process.env.MARKETING_API_KEY,           // 기본 키
      process.env.MARKETING_NAVER_API_KEY,     // 네이버용
      process.env.MARKETING_KAKAO_API_KEY,     // 카카오용
      'test_api_key_12345',                    // 테스트용 (나중에 삭제)
    ].filter(Boolean)

    // API Key가 없거나 유효하지 않으면 거부
    if (!apiKey || !validKeys.includes(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API Key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { customer_name, customer_phone, content, source = '카스피릿' } = body

    // 필수 값 검증
    if (!customer_name || !customer_phone || !content) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. 다음 배정 영업자 선택
    const rotationUser = await getNextRotationUser(supabase)
    const assignedUserId = rotationUser.user.id
    const assignedUserName = rotationUser.user.name
    const assignedUserPhone = rotationUser.user.phone

    // 2. 문의 생성
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        content: content.trim(),
        source,
        user_id: assignedUserId,
        assigned_to: assignedUserId,
        assigned_to_name: assignedUserName,
        status: '신규',
      })
      .select()
      .single()

    if (inquiryError) {
      console.error('문의 생성 에러:', inquiryError)
      throw new Error('문의 접수 실패')
    }

    // 3. 로테이션 상태 업데이트
    await updateRotationState(supabase, assignedUserId)

    // 4. 카카오톡 알림 발송 (비동기로 실행, 실패해도 문의 접수는 성공)
    sendKakaoNotification(assignedUserPhone, customer_name, content).catch(console.error)

    return NextResponse.json({
      success: true,
      inquiry_id: inquiry.id,
      assigned_to: assignedUserName,
    })
  } catch (error) {
    console.error('문의 접수 API 에러:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
