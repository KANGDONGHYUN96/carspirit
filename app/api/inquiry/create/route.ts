import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// 고정 배정 영업자 조회 (장동규 - 킹카노인정)
async function getFixedAssignUser(supabase: any) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', '킹카노인정')
    .eq('approved', true)
    .single()

  if (error || !user) {
    console.error('❌ 고정 배정 영업자 조회 실패:', error)
    throw new Error('고정 배정 영업자(킹카노인정)를 찾을 수 없습니다')
  }

  console.log('✅ 고정 배정 영업자:', user.name)
  return user
}

// PHP 프록시 설정 (카페24 고정 IP: 112.175.247.179)
const ALIGO_PROXY_URL = 'https://carspirit.kr/aligo-proxy.php'
const ALIGO_PROXY_KEY = 'carspirit_aligo_proxy_2024_secret'

// 재시도 설정
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2초

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 카카오톡 알림톡 발송 (PHP 프록시 경유)
async function sendKakaoAlimtalk(phone: string, assignedUserName: string, customerName: string, customerPhone: string, content: string) {
  // 전화번호 포맷팅 (하이픈 제거)
  const formattedPhone = phone.replace(/-/g, '')
  const formattedCustomerPhone = customerPhone.replace(/-/g, '')

  console.log('📱 알림톡 발송 시도 (PHP 프록시):', {
    receiver: formattedPhone,
    customer: customerName,
    customerPhone: formattedCustomerPhone,
  })

  // 재시도 로직
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃

      const response = await fetch(ALIGO_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proxy-Key': ALIGO_PROXY_KEY,
        },
        body: JSON.stringify({
          receiver: formattedPhone,
          assigned_user_name: assignedUserName,
          customer_name: customerName,
          customer_phone: formattedCustomerPhone,
          content: content,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()
      console.log(`📤 알림톡 프록시 응답 (시도 ${attempt}/${MAX_RETRIES}):`, result)

      if (result.success) {
        console.log('✅ 알림톡 발송 성공!')
        return { success: true, result }
      } else {
        console.error(`❌ 알림톡 발송 실패 (시도 ${attempt}/${MAX_RETRIES}):`, result)

        // 마지막 시도가 아니면 재시도
        if (attempt < MAX_RETRIES) {
          console.log(`⏳ ${RETRY_DELAY / 1000}초 후 재시도...`)
          await delay(RETRY_DELAY)
        }
      }
    } catch (error) {
      console.error(`❌ 알림톡 발송 에러 (시도 ${attempt}/${MAX_RETRIES}):`, error)

      // 마지막 시도가 아니면 재시도
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ ${RETRY_DELAY / 1000}초 후 재시도...`)
        await delay(RETRY_DELAY)
      }
    }
  }

  console.error('❌ 알림톡 발송 최종 실패 (모든 재시도 소진)')
  return { success: false, error: '모든 재시도 실패' }
}

// 허용된 도메인 목록 (환경변수로 관리)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://carspirit.co.kr',
  'https://www.carspirit.co.kr',
  'https://carspirit.vercel.app',
  'https://carspiritadmin.com',
  'https://www.carspiritadmin.com',
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

// 승계문의 여부 확인 (content, source, Referer로 판단)
function isSuccessionInquiry(request: Request, content: string, source: string): boolean {
  // 1. content에 "[승계 상담]" 또는 "승계"가 포함되면 승계문의
  if (content && (content.includes('[승계 상담]') || content.includes('승계'))) {
    return true
  }
  // 2. source가 "승계"를 포함하면 승계문의
  if (source && source.includes('승계')) {
    return true
  }
  // 3. Referer에 /succession이 포함되면 승계문의 (백업)
  const referer = request.headers.get('Referer') || ''
  return referer.includes('/succession')
}

// 관리자들에게 알림톡 발송 (승계문의용)
async function sendAlimtalkToAdmins(supabase: any, customerName: string, customerPhone: string, content: string) {
  // admin role 사용자들의 전화번호 조회
  const { data: admins, error } = await supabase
    .from('users')
    .select('name, phone')
    .eq('role', 'admin')
    .eq('approved', true)
    .not('phone', 'is', null)

  if (error) {
    console.error('❌ 관리자 조회 에러:', error)
    return
  }

  if (!admins || admins.length === 0) {
    console.warn('⚠️ 알림톡을 받을 관리자가 없습니다.')
    return
  }

  console.log(`📱 ${admins.length}명의 관리자에게 승계문의 알림톡 발송`)

  // 각 관리자에게 알림톡 발송
  for (const admin of admins) {
    if (admin.phone) {
      sendKakaoAlimtalk(
        admin.phone,
        admin.name,
        customerName,
        customerPhone,
        `[승계문의] ${content}`
      ).catch(err => {
        console.error(`관리자 ${admin.name} 알림톡 발송 실패:`, err)
      })
    }
  }
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
    const { customer_name, customer_phone, content, source = '카스피릿', marketing_agreed = false } = body

    // 🔍 디버깅: 요청 정보 로깅
    const referer = request.headers.get('Referer') || ''
    console.log('📥 문의 API 요청:', {
      referer,
      source,
      inquiry_type: body.inquiry_type,
      isSuccession: referer.includes('/succession'),
      customer_name,
    })

    // 필수 값 검증
    if (!customer_name || !customer_phone || !content) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요' },
        { status: 400, headers }
      )
    }

    const supabase = createAdminClient()

    // 승계문의인 경우 별도 테이블에 저장
    if (isSuccessionInquiry(request, content, source)) {
      console.log('🔄 승계문의로 처리')

      const { data: inquiry, error: inquiryError } = await supabase
        .from('succession_inquiries')
        .insert({
          customer_name: customer_name.trim(),
          customer_phone: customer_phone.trim(),
          content: content.trim(),
          source: source || '승계',
          status: '신규',
        })
        .select()
        .single()

      if (inquiryError) {
        console.error('승계문의 생성 에러:', inquiryError)
        throw new Error('승계문의 접수 실패')
      }

      // 관리자들에게 알림톡 발송 (await로 완료 대기)
      try {
        await sendAlimtalkToAdmins(supabase, customer_name, customer_phone, content)
      } catch (err) {
        console.error('관리자 알림톡 발송 중 에러 (문의 접수는 성공):', err)
      }

      return NextResponse.json(
        {
          success: true,
          inquiry_id: inquiry.id,
          type: 'succession',
        },
        { headers }
      )
    }

    // 일반 문의 처리
    // 1. 고정 배정 영업자 조회 (장동규 - 킹카노인정)
    const assignedUser = await getFixedAssignUser(supabase)
    const assignedUserId = assignedUser.id
    const assignedUserName = assignedUser.name
    const assignedUserPhone = assignedUser.phone // 영업자 전화번호

    // 2. 문의 생성 (담당자에게 영구 귀속)
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
        marketing_agreed: Boolean(marketing_agreed),
      })
      .select()
      .single()

    if (inquiryError) {
      console.error('문의 생성 에러:', inquiryError)
      throw new Error('문의 접수 실패')
    }

    // 3. 카카오톡 알림톡 발송 (await로 완료 대기)
    if (assignedUserPhone) {
      try {
        await sendKakaoAlimtalk(
          assignedUserPhone,
          assignedUserName,
          customer_name,
          customer_phone,
          content
        )
      } catch (err) {
        console.error('알림톡 발송 중 에러 발생 (문의 접수는 성공):', err)
      }
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
