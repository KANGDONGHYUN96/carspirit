import DashboardLayout from '@/components/layout/dashboard-layout'
import CapitalPromoSection from '@/components/dashboard/capital-promo-section'
import StrategicModelSection from '@/components/dashboard/strategic-model-section'
import CompanyGallery from '@/components/dashboard/company-gallery'
import VehicleGallerySection from '@/components/dashboard/vehicle-gallery-section'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import CopyProtectionWrapper from '@/components/common/copy-protection-wrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // 캐피탈 프로모션 가져오기 (모든 활성 프로모션)
  const { data: promotions } = await supabase
    .from('capital_promotions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // 전략차종 가져오기 (모든 활성 차종)
  const { data: strategicModels } = await supabase
    .from('strategic_vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // 업체별 특이사항 데이터 가져오기
  const { data: companies } = await supabase
    .from('company_details')
    .select('*')
    .order('display_order', { ascending: true })

  // 출고 사진 갤러리 가져오기
  const { data: vehicles } = await supabase
    .from('vehicle_gallery')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <CopyProtectionWrapper className="p-6 space-y-6">
        {/* 1️⃣ 캐피탈별 추가지원 섹션 */}
        <CapitalPromoSection promotions={promotions || []} />

        {/* 2️⃣ 전략차종 섹션 */}
        <StrategicModelSection models={strategicModels || []} />

        {/* 3️⃣ 업체별 특이사항 갤러리 */}
        <CompanyGallery companies={companies || []} isAdmin={user?.role === 'admin'} />

        {/* 4️⃣ 출고 사진 갤러리 */}
        <VehicleGallerySection
          vehicles={vehicles || []}
          userId={user?.id || ''}
          userName={user?.name || ''}
          userRole={user?.role || 'salesperson'}
        />
      </CopyProtectionWrapper>
    </DashboardLayout>
  )
}
