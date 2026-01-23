import { createAdminClient } from '@/lib/supabase/admin'
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
  console.log('✅ 선택된 로테이션 사용자:', rotationUser)

  // 2. users 테이블에서 영업자 정보 가져오기
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', rotationUser.user_id)
    .single()

  console.log('📋 user 쿼리 결과:', { user, userError })

  if (userError) {
    console.error('❌ users 조회 에러:', {
      message: userError.message,
      details: userError.details,
      hint: userError.hint,
      code: userError.code,
      user_id: rotationUser.user_id,
    })
    throw new Error('영업자 정보 조회 실패: ' + userError.message)
  }

  if (!user) {
    console.error('❌ user가 null:', rotationUser.user_id)
    throw new Error('영업자 정보를 찾을 수 없습니다')
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

// 카카오톡 알림톡 발송 (알리고 API)
async function sendKakaoAlimtalk(phone: string, assignedUserName: string, customerName: string, customerPhone: string, content: string) {
  // 알리고 API 설정이 있을 때만 발송
  const aligoKey = process.env.ALIGO_API_KEY
  const aligoUserId = process.env.ALIGO_USER_ID
  const aligoSenderKey = process.env.ALIGO_SENDER_KEY
  const aligoSenderPhone = process.env.ALIGO_SENDER_PHONE
  const aligoTemplateCode = process.env.ALIGO_TEMPLATE_CODE || 'TK_9999' // 기본 템플릿 코드

  if (!aligoKey || !aligoUserId || !aligoSenderKey || !aligoSenderPhone) {
    console.warn('⚠️ 알림톡 설정이 없습니다. 환경 변수를 확인하세요.')
    return { success: false, message: '알림톡 설정 없음' }
  }

  try {
    // 전화번호 포맷팅 (하이픈 제거)
    const formattedPhone = phone.replace(/-/g, '')
    const formattedCustomerPhone = customerPhone.replace(/-/g, '')

    console.log('📱 알림톡 발송 시도:', {
      receiver: formattedPhone,
      customer: customerName,
      customerPhone: formattedCustomerPhone,
    })

    const formData = new URLSearchParams()
    formData.append('apikey', aligoKey)
    formData.append('userid', aligoUserId)
    formData.append('senderkey', aligoSenderKey)
    formData.append('tpl_code', aligoTemplateCode)
    formData.append('sender', aligoSenderPhone)
    formData.append('receiver_1', formattedPhone)
    formData.append('subject_1', '[카스피릿] 신규문의')
    // 템플릿 변수를 실제 값으로 치환해서 전송
    const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content
    formData.append('message_1', `[카스피릿] 신규문의\n\n안녕하세요 ${assignedUserName}님!\n새로운 고객 문의가 배정되었습니다.\n\n고객명: ${customerName}\n연락처: ${formattedCustomerPhone}\n문의내용: ${truncatedContent}\n\n지금 바로 확인하세요!`)

    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const result = await response.json()
    console.log('📤 알림톡 API 응답:', result)

    if (result.code === '0' || result.result_code === '1') {
      console.log('✅ 알림톡 발송 성공!')
      return { success: true, result }
    } else {
      console.error('❌ 알림톡 발송 실패:', result)
      return { success: false, result }
    }
  } catch (error) {
    console.error('❌ 알림톡 발송 에러:', error)
    return { success: false, error }
  }
}

// 허용된 도메인 목록 (환경변수로 관리)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://carspirit.co.kr',
  'https://www.carspirit.co.kr',
  'https://carspirit.vercel.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
].filter(Boolean)

// CORS 헤더 생성 함수
function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('Origin')
  return new Response(null, { status: 200, headers: getCorsHeaders(origin) })
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin')
  const headers = getCorsHeaders(origin)

  try {
    // API Key 검증 (마케팅 업체용)
    const apiKey = request.headers.get('X-API-Key')
    const validKeys = [
      process.env.MARKETING_API_KEY,           // 기본 키
      process.env.MARKETING_NAVER_API_KEY,     // 네이버용
      process.env.MARKETING_KAKAO_API_KEY,     // 카카오용
    ].filter(Boolean)

    // API Key가 없거나 유효하지 않으면 거부
    if (!apiKey || !validKeys.includes(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API Key' },
        { status: 401, headers }
      )
    }

    const body = await request.json()
    const { customer_name, customer_phone, content, source = '카스피릿' } = body

    // 필수 값 검증
    if (!customer_name || !customer_phone || !content) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요' },
        { status: 400, headers }
      )
    }

    const supabase = createAdminClient()

    // 1. 다음 배정 영업자 선택
    const rotationUser = await getNextRotationUser(supabase)
    const assignedUserId = rotationUser.user.id
    const assignedUserName = rotationUser.user.name
    const assignedUserPhone = rotationUser.user.phone // 영업자 전화번호

    // 2. 문의 생성 (7일 후 자동 오픈)
    const unlockAt = new Date()
    unlockAt.setDate(unlockAt.getDate() + 7)

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
        unlock_at: unlockAt.toISOString(),
      })
      .select()
      .single()

    if (inquiryError) {
      console.error('문의 생성 에러:', inquiryError)
      throw new Error('문의 접수 실패')
    }

    // 3. 로테이션 상태 업데이트
    await updateRotationState(supabase, assignedUserId)

    // 4. 카카오톡 알림톡 발송 (비동기로 실행, 실패해도 문의 접수는 성공)
    if (assignedUserPhone) {
      sendKakaoAlimtalk(
        assignedUserPhone,
        assignedUserName,
        customer_name,
        customer_phone,
        content
      ).catch(err => {
        console.error('알림톡 발송 중 에러 발생 (문의 접수는 성공):', err)
      })
    } else {
      console.warn('⚠️ 담당자 전화번호가 없어서 알림톡을 발송하지 못했습니다.')
    }

    return NextResponse.json(
      {
        success: true,
        inquiry_id: inquiry.id,
        assigned_to: assignedUserName,
      },
      { headers }
    )
  } catch (error) {
    console.error('문의 접수 API 에러:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다' },
      { status: 500, headers }
    )
  }
}
