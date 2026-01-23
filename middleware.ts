import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabase 환경 변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // 환경 변수가 설정되지 않은 경우, 설정 안내 페이지로 리다이렉트
    if (request.nextUrl.pathname !== '/setup-required') {
      return NextResponse.redirect(new URL('/setup-required', request.url))
    }
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  // 공개 경로 (인증 불필요)
  const publicPaths = ['/auth/callback', '/auth/pending', '/auth/auth-code-error', '/api/inquiry/create']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return supabaseResponse
  }

  // 로그인 페이지
  if (request.nextUrl.pathname === '/login') {
    // 이미 로그인된 사용자는 대시보드로
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // 인증이 필요한 페이지
  if (!user && request.nextUrl.pathname !== '/login') {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 관리자 페이지 접근 제어
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 사용자 role 확인 필요 (추가 DB 쿼리 또는 JWT에서 확인)
    // 여기서는 기본적인 인증만 처리
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
