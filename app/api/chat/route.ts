import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
    }

    // Supabase에서 업체 데이터 가져오기
    const supabase = await createClient()
    const { data: companies, error } = await supabase
      .from('company_details')
      .select('*')
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 })
    }

    // 업체별 파일 정보 가져오기
    const { data: allFiles } = await supabase
      .from('company_files')
      .select('company_id, file_name, file_type')
      .order('uploaded_at', { ascending: false })

    // 업체별로 파일 그룹화
    const filesByCompany: Record<string, any[]> = {}
    allFiles?.forEach((file: any) => {
      if (!filesByCompany[file.company_id]) {
        filesByCompany[file.company_id] = []
      }
      filesByCompany[file.company_id].push({
        name: file.file_name,
        type: file.file_type
      })
    })

    // 업체 데이터에 파일 정보 추가
    const companiesWithFiles = companies?.map((company: any) => ({
      ...company,
      files: filesByCompany[company.id] || []
    }))

    // 업체 데이터를 JSON 문자열로 변환 (AI에게 전달)
    const companyData = JSON.stringify(companiesWithFiles, null, 2)

    // OpenAI에게 질문 분석 요청
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 렌트/리스 업체 정보 전문가입니다. 사용자의 질문을 분석하여 아래 업체 데이터에서 관련 정보를 찾아 친절하게 답변해주세요.

**중요 규칙:**
1. 반드시 제공된 업체 데이터만 사용하여 답변하세요
2. 데이터에 없는 정보는 "해당 정보가 데이터에 없습니다"라고 답변하세요
3. 한국어로 자연스럽게 답변하세요
4. 가능하면 표나 목록 형식으로 정리해서 보여주세요
5. 답변에 업체명을 명확히 포함하세요

**파일 관련 중요 규칙:**
6. 사용자가 "서류", "파일", "견적기", "양식", "신청서" 등을 요청하면, 해당 업체의 files 배열을 확인하세요
7. files 배열에 파일이 있으면, 반드시 정확한 파일명을 **그대로** 답변에 포함하세요
8. 파일명을 언급할 때 따옴표나 다른 문자 추가 없이 정확히 그대로 써주세요
   예시: "BNK캐피탈_전기차 신청.pdf 파일을 확인하세요"
9. files 배열이 비어있으면 "현재 등록된 파일이 없습니다"라고 답변하세요

**업체 데이터:**
${companyData}

**컬럼 설명:**
- company_name: 업체명
- age_limit: 연령제한
- mileage_excess: 운행거리 초과/유예거리
- total_loss: 차량 전손시 조건
- foreigner: 외국인 진행 가능 여부
- deductible: 면책금
- rent_import_insurance_age: 렌트 수입차 보험연령
- new_corporation: 신설법인
- product_types: 상품구분 (장기렌트/리스)
- files: 업체별 업로드된 파일 목록 (name: 파일명, type: 파일 형식)
- 기타 모든 컬럼은 해당 업체의 특이사항입니다`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.3, // 정확한 답변을 위해 낮게 설정
      max_tokens: 1500,
    })

    const aiResponse = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.'

    // AI 응답에서 언급된 업체명 추출
    const mentionedCompanies = companies?.filter((company: any) =>
      aiResponse.includes(company.company_name)
    ) || []

    // AI 응답에서 언급된 파일명 찾기
    const mentionedFiles: any[] = []
    allFiles?.forEach((file: any) => {
      if (aiResponse.includes(file.file_name)) {
        // 파일의 전체 정보 가져오기 (URL 포함)
        supabase
          .from('company_files')
          .select('*, company_details!inner(company_name)')
          .eq('id', file.id)
          .single()
          .then(({ data }) => {
            if (data) {
              mentionedFiles.push({
                id: data.id,
                file_name: data.file_name,
                file_url: data.file_url,
                file_type: data.file_type,
                company_name: (data.company_details as any).company_name
              })
            }
          })
      }
    })

    // 언급된 파일의 URL을 가져오기 위해 다시 조회
    const fileNames = Array.from(new Set(
      allFiles?.filter((f: any) => aiResponse.includes(f.file_name)).map((f: any) => f.file_name) || []
    ))

    const { data: filesWithUrls } = await supabase
      .from('company_files')
      .select('id, file_name, file_url, file_type, company_id')
      .in('file_name', fileNames)

    // 파일에 업체 정보 추가
    const filesWithCompanyInfo = filesWithUrls?.map((file: any) => {
      const company = companies?.find((c: any) => c.id === file.company_id)
      return {
        ...file,
        company_name: company?.company_name || '알 수 없음'
      }
    }) || []

    return NextResponse.json({
      response: aiResponse,
      mentionedCompanies: mentionedCompanies.map((c: any) => ({
        id: c.id,
        company_name: c.company_name,
        logo_url: c.logo_url,
        product_types: c.product_types
      })),
      mentionedFiles: filesWithCompanyInfo
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || '챗봇 응답 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
