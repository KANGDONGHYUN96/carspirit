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
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <div className="max-w-[480px] w-full px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
            <span className="text-3xl font-bold text-white">CS</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            계정을 선택하세요.
          </h1>
          <p className="text-base text-gray-600">
            CarSpirit(으)로 이동
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-12 shadow-sm hover:shadow-md transition-shadow duration-200">
          <LoginForm />
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            CarSpirit의 개인정보보호정책 및 서비스 약관을 검토하여 uxxztunswlxwsqphcpai.supabase.co에서 내 데이터를 처리하고 보호하는 방법을 알아보세요.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            처음 로그인 시 관리자의 승인이 필요합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
