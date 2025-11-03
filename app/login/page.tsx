import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-snow-bg relative overflow-hidden">
      <div className="max-w-md w-full px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-lg bg-gray-900">
            <img
              src="/carspirit-logo.png"
              alt="CarSpirit"
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400 bg-clip-text text-transparent mb-3">
            카스피릿
          </h1>
          <p className="text-gray-600 text-lg">
            렌트/리스 영업 통합 관리 시스템
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
          <LoginForm />
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            처음 로그인 시 관리자의 승인이 필요합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
