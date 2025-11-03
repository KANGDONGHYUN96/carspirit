import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PendingPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  console.log('User query result:', { user, userError, authUserId: authUser.id })

  // 승인된 사용자는 대시보드로
  if (user?.approved) {
    console.log('User is approved, redirecting to dashboard')
    redirect('/dashboard')
  } else {
    console.log('User not approved or not found:', { approved: user?.approved, user })
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-snow-bg relative overflow-hidden">
      <div className="max-w-lg w-full px-6 relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-900 border border-gray-200">
            <img
              src="/carspirit-logo.png"
              alt="CarSpirit"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:border-blue-500/40 transition-all duration-300">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border border-blue-200 shadow-lg">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 w-20 h-20 bg-blue-200/50 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
            승인 대기 중
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 text-center mb-8 text-base leading-relaxed">
            관리자가 회원가입을 검토하고 있습니다.<br />
            승인이 완료되면 이메일로 알려드리겠습니다.
          </p>

          {/* Info Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1 text-sm">회원가입 완료</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  회원가입이 성공적으로 완료되었습니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1 text-sm">승인 대기 중</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  관리자가 검토 중입니다. 일반적으로 1-2일 정도 소요됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-1 text-sm">이메일 알림</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  승인 완료 시 <span className="text-gray-900 font-medium">{authUser.email}</span>로 알림을 보내드립니다.
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full bg-gray-100 border border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 hover:border-red-300 hover:text-red-600 transition-all duration-300"
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            문의사항이 있으신가요?{' '}
            <a
              href="mailto:support@carspirit.com"
              className="text-blue-500 hover:text-blue-600 transition-colors duration-300 font-medium"
            >
              고객센터
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
