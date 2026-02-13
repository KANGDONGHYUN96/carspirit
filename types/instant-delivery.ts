// 즉시출고 페이지 타입 정의

export type VehicleCategory = 'special' | 'dealer';
export type ProductType = '렌트' | '리스' | '렌트/리스' | null;

// 차량 마스터 테이블 타입
export interface VehicleMaster {
  id: string;
  brand: string;
  model_name: string;
  image_code: string;
  image_path: string;
  brand_logo_path: string | null;
  keywords: string[] | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 즉시출고 차량 타입 (실제 DB 스키마: instant_delivery_vehicles_v2)
export interface InstantDeliveryVehicle {
  id: string;
  source: string;
  source_code: string | null;
  product_type: string | null;
  brand: string | null;
  vehicle_name: string;
  lineup: string | null;
  trim: string | null;
  options: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  price: number | null;
  promotion: string | null;
  note: string | null;
  raw_vehicle_name: string | null;
  category: 'special' | 'dealer';
  sale_condition: string | null;
  discount: number | null;
  created_at: string;
  updated_at: string;
}

// 금융사 매핑 타입
export interface FinanceCompanyMapping {
  id: string;
  source_name: string;
  display_name: string;
  logo_path: string;
  is_special_sale: boolean;
  is_active: boolean;
  created_at: string;
}

// 차량 카드 데이터 타입
export interface VehicleCardData {
  brand: string;
  brandLogo: string;
  modelName: string;
  vehicleImage: string;
  totalCount: number;
  vehicles: InstantDeliveryVehicle[];
}

// 브랜드 필터 데이터 타입
export interface BrandFilterData {
  brand: string;
  logo: string;
  count: number;
}

// 필터 상태 타입
export interface FilterState {
  category: VehicleCategory;
  brand: string | null;
  productType: ProductType;
  source: string | null;
  searchQuery: string;
}

// 파싱된 차량명 타입
export interface ParsedVehicle {
  brand: string;
  modelName: string;
  trim: string | null;
  lineup: string | null;
  originalName: string;
}

// API 응답 타입
export interface VehicleListResponse {
  vehicles: InstantDeliveryVehicle[];
  totalCount: number;
  brands: BrandFilterData[];
}

// 차량 그룹 (모델별 그룹핑)
export interface VehicleGroup {
  brand: string;
  modelName: string;
  vehicles: InstantDeliveryVehicle[];
  image: string;
  brandLogo: string;
}
