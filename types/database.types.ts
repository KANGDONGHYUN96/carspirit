export type UserRole = 'salesperson' | 'manager' | 'admin'

export type InquiryStatus = 'new' | 'in_progress' | 'completed' | 'cancelled' | '신규' | '관리' | '부재' | '심사' | '가망' | '계약'

export type ContractType = 'rent' | 'lease'

export type ContractStatus = 'pending' | 'approved' | 'completed' | 'cancelled'

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
  approved: boolean
  allowed_ip: string | null
  created_at: string
  last_login: string | null
  auth_user_id: string
  profile_image_url: string | null
  business_card_url: string | null
  admin_memo: string | null
}

export interface CapitalPromotion {
  id: string
  capital: string
  title: string
  support_amount: number
  description: string | null
  rent_promotion: string | null
  lease_promotion: string | null
  strategic_models: string | null
  conditions: string | null
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired'
  image_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface StrategicModel {
  id: string
  vehicle_name: string
  trim: string
  brand: string
  capital: string
  reason: string | null
  image_url: string | null
  display_order: number
  status: 'active' | 'inactive'
  date: string
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Inquiry {
  id: string
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  content: string
  status: InquiryStatus
  assigned_to: string | null
  assigned_to_name: string | null
  memo: string | null
  source: string | null
  locked_by: string | null
  locked_at: string | null
  unlock_at: string | null
  created_at: string
  updated_at: string
}

export interface StockList {
  id: string
  brand: string
  model: string
  trim: string
  year: number
  color: string | null
  price: number
  promo: string | null
  capital: string
  availability: 'available' | 'reserved' | 'sold'
  location: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface ChatbotLog {
  id: string
  user_id: string | null
  customer_name: string
  customer_phone: string | null
  message: string
  ai_response: string | null
  rating: number | null
  memo: string | null
  created_at: string
}

export interface Contract {
  id: string
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  vehicle_name: string
  vehicle_trim: string | null
  brand: string
  capital: string
  dealership: string | null
  contract_type: ContractType
  amount: number
  commission: number
  status: ContractStatus
  contract_date: string
  memo: string | null
  created_at: string
  updated_at: string
}

export interface Log {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  timestamp: string
}
