import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# .env.local 파일 로드
load_dotenv('../.env.local')

# Supabase 설정
SUPABASE_URL = "https://uxxztunswlxwsqphcpai.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eHp0dW5zd2x4d3NxcGhjcGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTg3MDgsImV4cCI6MjA3NzIzNDcwOH0.JKlDlXv3x-RwZ6b3Q7EmFbE5O3_XRg3O_LW4OYpSlsM"

# 엑셀 파일 경로 설정
file_path = r'C:\Users\atong\OneDrive\바탕 화면\KS오토플랜 차량리스트\bnkcar.xlsx'

# 엑셀 파일에서 필요한 열만 선택하여 읽기
df = pd.read_excel(file_path, usecols=[1, 3, 4, 5, 6, 7, 8, 9])

# 열 이름을 Supabase 테이블의 열 이름과 일치하도록 변경
df.columns = ['프로모션', '상품구분', '차량명', '옵션', '외장', '내장', '차량가', '비고']

# 출처 열 추가 및 값 설정 ('BNK캐피탈'로 전처리)
df.insert(0, '출처', 'BNK캐피탈')

# 열 순서 재정렬
df = df[['출처', '차량명', '옵션', '외장', '내장', '차량가', '프로모션', '상품구분', '비고']]

# NaN 값을 None으로 변경
df = df.where(pd.notnull(df), None)

# Supabase 테이블 열 이름으로 매핑
column_mapping = {
    '출처': 'source',
    '차량명': 'vehicle_name',
    '옵션': 'options',
    '외장': 'exterior_color',
    '내장': 'interior_color',
    '차량가': 'price',
    '프로모션': 'promotion',
    '상품구분': 'product_type',
    '비고': 'note'
}

df.rename(columns=column_mapping, inplace=True)

# NaN을 None으로 다시 한번 확실하게 변환
df = df.replace({pd.NA: None, float('nan'): None})
df = df.applymap(lambda x: None if pd.isna(x) else x)

try:
    # Supabase 클라이언트 생성
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 이전 데이터 삭제 (출처가 BNK캐피탈인 데이터 삭제)
    print("이전 데이터(출처: BNK캐피탈) 삭제 중...")
    delete_result = supabase.table('instant_delivery_vehicles').delete().eq('source', 'BNK캐피탈').execute()
    print(f"이전 데이터가 성공적으로 삭제되었습니다. (삭제된 행: {len(delete_result.data) if delete_result.data else 0}개)")

    # Supabase 테이블에 데이터 업로드 함수 정의
    def upload_to_supabase(dataframe, supabase_client):
        # 데이터프레임을 딕셔너리 리스트로 변환하고 NaN을 None으로 변환
        records = dataframe.to_dict('records')

        # 각 레코드에서 NaN 값을 None으로 변환
        import math
        for record in records:
            for key, value in record.items():
                if isinstance(value, float) and math.isnan(value):
                    record[key] = None

        # 데이터를 50개씩 배치로 나누어 업로드 (Supabase API 제한 고려)
        batch_size = 50
        total_uploaded = 0

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                result = supabase_client.table('instant_delivery_vehicles').insert(batch).execute()
                total_uploaded += len(batch)
                print(f"진행 중: {total_uploaded}/{len(records)} 행 업로드 완료")
            except Exception as e:
                print(f"배치 업로드 중 오류 발생: {e}")
                print(f"문제의 배치 시작 인덱스: {i}")
                # 개별 행으로 재시도
                for j, record in enumerate(batch):
                    try:
                        supabase_client.table('instant_delivery_vehicles').insert(record).execute()
                        total_uploaded += 1
                    except Exception as row_error:
                        print(f"행 {i+j} 업로드 실패: {row_error}")
                        print(f"문제의 데이터: {record}")

        print(f"\n총 {total_uploaded}개의 데이터가 Supabase에 성공적으로 업로드되었습니다.")

    # 함수 호출하여 데이터 업로드
    upload_to_supabase(df, supabase)

except Exception as e:
    print(f"Supabase에 연결하거나 데이터를 업로드하는 중 오류가 발생했습니다: {e}")
    import traceback
    traceback.print_exc()

print("\n작업 완료!")
