import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTableInfo() {
  console.log('\n========================================')
  console.log('📊 Supabase 데이터베이스 테이블 목록')
  console.log('========================================\n')

  // 1. 테이블 목록 조회
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables_info')
    .select('*')

  if (tablesError) {
    // RPC가 없으면 직접 쿼리
    console.log('RPC 없음, 직접 information_schema 조회 시도...\n')

    // 각 테이블별로 데이터 카운트 확인
    const tableNames = [
      'users',
      'contracts',
      'inquiries',
      'capital_promotions',
      'strategic_models',
      'stock_list',
      'chatbot_logs',
      'logs',
      'instant_delivery_vehicles',
      'company_details',
      'vehicle_gallery',
      'chat_history',
      'user_rotation',
      'rotation_state',
      'strategic_vehicles'
    ]

    console.log('테이블명 | 행 수 | 샘플 컬럼')
    console.log('---------|-------|----------')

    for (const tableName of tableNames) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: false })
          .limit(1)

        if (error) {
          console.log(`${tableName} | ❌ 접근 불가 | ${error.message}`)
        } else {
          const columns = data && data[0] ? Object.keys(data[0]).join(', ') : '(빈 테이블)'
          console.log(`${tableName} | ${count ?? 0}개 | ${columns.substring(0, 50)}...`)
        }
      } catch (e) {
        console.log(`${tableName} | ❌ 에러`)
      }
    }
  }

  // 2. contracts 테이블 상세 구조 확인
  console.log('\n\n========================================')
  console.log('📋 contracts 테이블 상세 (샘플 1개)')
  console.log('========================================\n')

  const { data: contractSample, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .limit(1)

  if (contractError) {
    console.log('contracts 조회 에러:', contractError.message)
  } else if (contractSample && contractSample[0]) {
    console.log('컬럼 목록:')
    Object.keys(contractSample[0]).forEach(key => {
      const value = contractSample[0][key]
      const type = value === null ? 'null' : typeof value
      console.log(`  - ${key}: ${type} (예: ${JSON.stringify(value)?.substring(0, 30)})`)
    })
  }

  // 3. inquiries 테이블 상세 구조 확인
  console.log('\n\n========================================')
  console.log('📋 inquiries 테이블 상세 (샘플 1개)')
  console.log('========================================\n')

  const { data: inquirySample, error: inquiryError } = await supabase
    .from('inquiries')
    .select('*')
    .limit(1)

  if (inquiryError) {
    console.log('inquiries 조회 에러:', inquiryError.message)
  } else if (inquirySample && inquirySample[0]) {
    console.log('컬럼 목록:')
    Object.keys(inquirySample[0]).forEach(key => {
      const value = inquirySample[0][key]
      const type = value === null ? 'null' : typeof value
      console.log(`  - ${key}: ${type} (예: ${JSON.stringify(value)?.substring(0, 30)})`)
    })
  }

  // 4. users 테이블 상세 구조 확인
  console.log('\n\n========================================')
  console.log('📋 users 테이블 상세 (샘플 1개)')
  console.log('========================================\n')

  const { data: userSample, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (userError) {
    console.log('users 조회 에러:', userError.message)
  } else if (userSample && userSample[0]) {
    console.log('컬럼 목록:')
    Object.keys(userSample[0]).forEach(key => {
      const value = userSample[0][key]
      const type = value === null ? 'null' : typeof value
      console.log(`  - ${key}: ${type} (예: ${JSON.stringify(value)?.substring(0, 30)})`)
    })
  }
}

getTableInfo()
  .then(() => {
    console.log('\n\n✅ 조회 완료')
    process.exit(0)
  })
  .catch(err => {
    console.error('에러:', err)
    process.exit(1)
  })
