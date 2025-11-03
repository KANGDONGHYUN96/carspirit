import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // users 테이블에 사용자 정보 확인 또는 생성
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (!existingUser) {
          // 신규 사용자 등록 (승인 대기 상태)
          const { error: insertError } = await supabase.from('users').insert({
            auth_user_id: user.id,
            email: user.email!,
            name: user.user_metadata.full_name || user.email!.split('@')[0],
            role: 'salesperson',
            approved: false,
          })

          if (insertError) {
            console.error('Error inserting user:', insertError)
            // 에러가 있어도 승인 대기 페이지로 (관리자가 수동으로 생성)
          }

          // 승인 대기 페이지로 리다이렉트
          return NextResponse.redirect(`${origin}/auth/pending`)
        }

        // 승인되지 않은 사용자
        if (!existingUser.approved) {
          return NextResponse.redirect(`${origin}/auth/pending`)
        }

        // 마지막 로그인 시간 업데이트
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 오류 발생 시 에러 페이지로
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
