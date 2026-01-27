'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const pathNameMap: { [key: string]: string } = {
  '/dashboard': '대시보드',
  '/inquiries': '나의문의',
  '/open-db': '오픈DB',
  '/instant-delivery': '즉시출고',
  '/chatbot': 'AI 챗봇',
  '/chat-history': '채팅 기록',
  '/contracts': '계약관리',
  '/profile': '내 계정',
  '/strategic-vehicles': '전략차종',
  '/admin': '관리자',
  '/admin/promotions': '프로모션 관리',
  '/admin/strategic-models': '전략차종 관리',
  '/admin/users': '사용자 관리',
  '/admin/analytics': '매출분석',
  '/admin/inquiry-statistics': '문의통계',
  '/admin/succession-inquiries': '승계문의',
  '/admin/sales': '매출관리',
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 브레드크럼 생성
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: '홈', href: '/dashboard' }]

    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      const name = pathNameMap[currentPath] || path
      breadcrumbs.push({ name, href: currentPath })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* 브레드크럼 */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.href}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="text-gray-500 hover:text-gray-700 transition-colors">
                  {crumb.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* 알림 버튼 */}
          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
          </button>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleSignOut}
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
