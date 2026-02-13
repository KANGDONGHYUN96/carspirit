// 현대 차량 이미지 매핑 (이미지코드 → 모델명)
const HYUNDAI_MODELS: Record<string, string> = {
  '01': '더 뉴 아반떼',
  '02': '더 뉴 아반떼 HEV',
  '03': '더 뉴 아반떼 N',
  '04': '쏘나타 디 엣지',
  '05': '쏘나타 디 엣지 HEV',
  '06': '디 올 뉴 그랜저',
  '07': '디 올 뉴 그랜저 HEV',
  '08': '더 뉴 아이오닉6',
  '09': '아이오닉 6 N',
  '10': '더 뉴 아이오닉 5',
  '11': '아이오닉 5 N',
  '12': '베뉴',
  '13': '디 올 뉴 코나',
  '14': '디 올 뉴 코나 HEV',
  '15': '디 올 뉴 코나 EV',
  '16': '더 뉴 투싼',
  '17': '더 뉴 투싼 HEV',
  '18': '디 올 뉴 싼타페',
  '19': '디 올 뉴 싼타페 HEV',
  '20': '아이오닉 9',
  '21': '디 올 뉴 팰리세이드',
  '22': '디 올 뉴 팰리세이드 HEV',
  '23': '더 뉴 스타리아',
  '24': '더 뉴 스타리아 HEV',
  '25': '스타리아',
  '26': '스타리아 HEV',
  '27': '더 뉴 캐스퍼',
  '28': '캐스퍼 일렉트릭',
  '29': '디 올 뉴 넥쏘',
  '30': '포터2',
  '31': '포터2 특장차',
  '32': '포터2 Electric'
}

// 기아 차량 이미지 매핑
const KIA_MODELS: Record<string, string> = {
  '0001': 'EV4',
  '0002': '더 뉴 K5',
  '0003': '더 뉴 K5 HEV',
  '0004': 'The New K8',
  '0005': 'The New K8 HEV',
  '0006': '더 뉴 K9',
  '0007': 'EV3',
  '0008': 'EV5',
  '0009': '디 올 뉴 니로 EV',
  '0010': '디 올 뉴 니로 HEV',
  '0011': '더 뉴 셀토스',
  '0012': '더 뉴 EV6',
  '0013': '더 뉴 쏘렌토',
  '0014': 'EV9',
  '0015': '더 뉴 카니발',
  '0016': 'PV5',
  '0017': '타스만',
  '0018': '봉고3 트럭',
  '0019': '봉고3 특장차',
  '0020': '봉고3 EV',
  '0021': '더 뉴 모닝',
  '0022': '더 뉴 레이 PE',
  '0023': '더 뉴 스포티지',
  '0024': '더 뉴 스포티지 HEV',
  '0025': '더 뉴 쏘렌토 HEV',
  '0026': '더 뉴 카니발 HEV',
  '0027': '레이 EV',
  '0028': '디 올 뉴 셀토스'
}

// 제네시스 차량 이미지 매핑
const GENESIS_MODELS: Record<string, string> = {
  '001': '디 올 뉴 G80 F/L',
  '002': '신형 G90',
  '003': 'GV70',
  '004': 'GV80 F/L',
  '005': 'GV80 Coupe',
  '006': '더 뉴 G70',
  '007': 'G70 슈팅브레이크',
  '008': 'GV60 마그마',
  '009': 'GV60 F/L'
}

// BMW 차량 이미지 매핑
const BMW_MODELS: Record<string, string> = {
  '2001': 'New 1 Series',
  '2002': 'New 2 Series',
  '2003': 'New 2 Series 액티브 투어러',
  '2004': 'The New 2 Series 그란 쿠페',
  '2005': 'New M2',
  '2006': '3 Series F/L',
  '2007': 'New M3',
  '2008': 'New 4 Series F/L',
  '2009': 'The M4 F/L',
  '2010': 'New i4',
  '2011': 'The New 5 Series',
  '2012': 'New M5',
  '2013': 'i5',
  '2014': 'New 6 Series',
  '2015': 'The New 7 Series',
  '2016': 'The New i7',
  '2017': '8 Series',
  '2018': 'M8',
  '2019': 'The New Z4',
  '2020': 'The New X1',
  '2021': 'iX1',
  '2022': 'New X2',
  '2023': 'New iX2',
  '2024': 'New X3',
  '2025': 'New iX3',
  '2026': 'The All New X4',
  '2027': 'X4 M',
  '2028': 'New X5',
  '2029': 'New X5 M',
  '2030': 'New X6',
  '2031': 'New X6 M',
  '2032': 'New X7',
  '2033': 'The XM',
  '2034': 'New iX'
}

// KGM 차량 이미지 매핑
const KGM_MODELS: Record<string, string> = {
  '0101': '더 뉴 티볼리',
  '0102': '더 뉴 티볼리 에어',
  '0103': '코란도',
  '0104': '액티언',
  '0105': '액티언 HEV',
  '0106': '더 뉴 토레스',
  '0107': '더 뉴 토레스 HEV',
  '0108': '토레스 EVX',
  '0109': '렉스턴 뉴 아레나',
  '0110': '렉스턴 써밋',
  '0111': '렉스턴 스포츠',
  '0112': '렉스턴 스포츠 칸',
  '0113': '무쏘 Q300',
  '0114': '무쏘 스포츠 Q250',
  '0115': '무쏘 칸 Q250',
  '0116': '무쏘 EV'
}

// 르노코리아 차량 이미지 매핑
const RENAULT_MODELS: Record<string, string> = {
  '00001': '더 뉴 SM6',
  '00002': '아르카나',
  '00003': '아르카나 E-TECH',
  '00004': '그랑 콜레오스',
  '00005': '그랑 콜레오스 E-TECH',
  '00006': '더 뉴 QM6',
  '00007': '필랑트',
  '00008': '세닉 E-테크 일렉트릭',
  '00009': 'QM6 Quest'
}

// 랜드로버 차량 이미지 매핑
const LANDROVER_MODELS: Record<string, string> = {
  '70': 'Range Rover Evoque',
  '71': 'Discovery Sport',
  '72': 'All New Discovery',
  '73': 'New Range Rover Velar',
  '74': 'The New Range Rover Sport',
  '75': 'The New Range Rover',
  '76': 'All New Defender'
}

// 벤츠 차량 이미지 매핑
const BENZ_MODELS: Record<string, string> = {
  '4001': 'The New A-Class F/L',
  '4002': 'The New C-Class',
  '4003': 'The New CLA-Class',
  '4004': 'The All New CLE',
  '4005': 'The New E-Class',
  '4006': 'The New S-Class',
  '4007': 'Maybach SL',
  '4008': 'The New Maybach S-Class',
  '4009': 'The New SL-Class',
  '4010': 'The New AMG GT',
  '4011': 'AMG GT',
  '4012': 'EQE',
  '4013': 'EQS',
  '4014': 'Maybach EQS SUV',
  '4015': 'Maybach GLS-Class F/L',
  '4016': 'The New EQA',
  '4017': 'The New EQB',
  '4018': 'The New EQE SUV',
  '4019': 'The New EQE AMG SUV',
  '4020': 'EQS SUV',
  '4021': 'GLB-Class F/L',
  '4022': 'GLA-Class F/L',
  '4023': 'The New GLC-Class',
  '4024': 'The New GLE-Class',
  '4025': 'The New GLS-Class F/L',
  '4026': 'EQ G-Class',
  '4027': 'The New G-Class'
}

// 쉐보레 차량 이미지 매핑
const CHEVROLET_MODELS: Record<string, string> = {
  '1001': '트랙스 크로스오버',
  '1002': '더 뉴 트레일블레이저',
  '1003': '올 뉴 콜로라도'
}

// 테슬라 차량 이미지 매핑
const TESLA_MODELS: Record<string, string> = {
  '50': 'New Model 3',
  '51': 'New Model S',
  '52': 'New Model X',
  '53': 'New Model Y',
  '54': 'Cybertruck'
}

// BYD 차량 이미지 매핑
const BYD_MODELS: Record<string, string> = {
  '6001': 'SEALION 7'
}

// 폴스타 차량 이미지 매핑
const POLESTAR_MODELS: Record<string, string> = {
  '90': '폴스타 2 F/L',
  '91': '폴스타 4'
}

// 역방향 매핑 생성 (모델명 → 이미지코드)
function createReverseMapping(mapping: Record<string, string>): Record<string, string> {
  const reverse: Record<string, string> = {}
  for (const [code, model] of Object.entries(mapping)) {
    reverse[model] = code
    // 공백 제거 버전도 추가
    reverse[model.replace(/\s+/g, '')] = code
  }
  return reverse
}

const HYUNDAI_REVERSE = createReverseMapping(HYUNDAI_MODELS)
const KIA_REVERSE = createReverseMapping(KIA_MODELS)
const GENESIS_REVERSE = createReverseMapping(GENESIS_MODELS)
const BMW_REVERSE = createReverseMapping(BMW_MODELS)
const KGM_REVERSE = createReverseMapping(KGM_MODELS)
const RENAULT_REVERSE = createReverseMapping(RENAULT_MODELS)
const LANDROVER_REVERSE = createReverseMapping(LANDROVER_MODELS)
const BENZ_REVERSE = createReverseMapping(BENZ_MODELS)
const CHEVROLET_REVERSE = createReverseMapping(CHEVROLET_MODELS)
const TESLA_REVERSE = createReverseMapping(TESLA_MODELS)
const BYD_REVERSE = createReverseMapping(BYD_MODELS)
const POLESTAR_REVERSE = createReverseMapping(POLESTAR_MODELS)

// 브랜드별 이미지 폴더 경로
const BRAND_IMAGE_FOLDERS: Record<string, string> = {
  '현대': '/car-image/hyundai',
  '기아': '/car-image/kia',
  '제네시스': '/car-image/genesis',
  'BMW': '/car-image/BMW',
  'KG모빌리티': '/car-image/KGM',
  '르노코리아': '/car-image/renault',
  '랜드로버': '/car-image/landrover',
  '벤츠': '/car-image/benz',
  '쉐보레': '/car-image/chevrolet',
  '테슬라': '/car-image/Tesla',
  '폴스타': '/car-image/polestar',
  'BYD': '/car-image/byd'
}

// 브랜드 로고 경로
const BRAND_LOGOS: Record<string, string> = {
  '현대': '/brand-logos/hyundai.png',
  '기아': '/brand-logos/kia.png',
  '제네시스': '/brand-logos/genesis.png',
  'BMW': '/brand-logos/bmw.png',
  '벤츠': '/brand-logos/benz.png',
  '아우디': '/brand-logos/audi.png',
  '볼보': '/brand-logos/volvo.png',
  '테슬라': '/brand-logos/tesla.png',
  '폴스타': '/brand-logos/polestar.png',
  '쉐보레': '/brand-logos/chevrolet.png',
  'KG모빌리티': '/brand-logos/kgm.png',
  '르노코리아': '/brand-logos/renault-korea.png',
  '랜드로버': '/brand-logos/landrover.png',
  'BYD': '/brand-logos/byd.png'
}

// 금융사 로고 경로
const SOURCE_LOGOS: Record<string, string> = {
  'KB캐피탈': '/company-logos/kb.png',
  '현대캐피탈': '/company-logos/hyundai-capital.png',
  '현대캐피탈(소호)': '/company-logos/hyundai-capital.png',
  '현대캐피탈(스타오토모빌)': '/company-logos/hyundai-capital.png',
  '현대캐피탈_신영': '/company-logos/hyundai-capital.png',
  '현대캐피탈_소호': '/company-logos/hyundai-capital.png',
  '현대캐피탈_소호_전략': '/company-logos/hyundai-capital.png',
  '현대캐피탈_소호_저금리': '/company-logos/hyundai-capital.png',
  'BNK캐피탈': '/company-logos/bnk.png',
  'IM캐피탈': '/company-logos/im.png',
  'MG캐피탈': '/company-logos/mg.png',
  '메리츠캐피탈': '/company-logos/meritz1.png',
  'JB우리캐피탈': '/company-logos/jb.png',
  '롯데렌터카': '/company-logos/lotte-rent.png',
  '롯데캐피탈': '/company-logos/lotte-capital.png',
  '오릭스캐피탈': '/company-logos/orix.png',
  '신한카드': '/company-logos/shinhan.png',
  'SK렌터카': '/company-logos/sk.png',
  '농협캐피탈': '/company-logos/nh.png',
  '우리금융캐피탈': '/company-logos/woori.png',
  '하나캐피탈': '/company-logos/hana.png',
  '현대대리점': '/company-logos/hyundai-capital.png',
  '기아대리점': '/company-logos/hyundai-capital.png'
}

// 키워드 → 이미지코드 직접 매핑 (한글/영문 혼용 해결)
const KEYWORD_TO_CODE: Record<string, Record<string, string>> = {
  '현대': {
    // 아반떼 계열
    '아반떼n': '03', '아반떼hev': '02', '아반떼hybrid': '02', '아반떼하이브리드': '02', '아반떼': '01',
    // 쏘나타 계열
    '쏘나타hev': '05', '쏘나타hybrid': '05', '쏘나타하이브리드': '05', '쏘나타디엣지hev': '05', '쏘나타디엣지': '04', '쏘나타': '04',
    // 그랜저 계열
    '그랜저hev': '07', '그랜저hybrid': '07', '그랜저하이브리드': '07', '디올뉴그랜저hev': '07', '디올뉴그랜저': '06', '그랜저': '06',
    // 아이오닉 계열
    '아이오닉6n': '09', '아이오닉6': '08', '아이오닉5n': '11', '아이오닉5': '10', '아이오닉9': '20',
    // 코나 계열
    '코나ev': '15', '코나electric': '15', '코나일렉트릭': '15', '코나hev': '14', '코나hybrid': '14', '코나하이브리드': '14', '코나': '13',
    // 투싼 계열
    '투싼hev': '17', '투싼hybrid': '17', '투싼하이브리드': '17', '투싼': '16',
    // 싼타페 계열
    '싼타페hev': '19', '싼타페hybrid': '19', '싼타페하이브리드': '19', '디올뉴싼타페hev': '19', '디올뉴싼타페': '18', '싼타페': '18',
    // 팰리세이드 계열
    '팰리세이드hev': '22', '팰리세이드hybrid': '22', '팰리세이드하이브리드': '22', '디올뉴팰리세이드hev': '22', '디올뉴팰리세이드': '21', '팰리세이드': '21',
    // 스타리아 계열
    '더뉴스타리아hev': '24', '스타리아hev': '26', '스타리아hybrid': '26', '더뉴스타리아': '23', '스타리아': '25',
    // 캐스퍼 계열
    '캐스퍼일렉트릭': '28', '캐스퍼ev': '28', '캐스퍼electric': '28', '더뉴캐스퍼': '27', '캐스퍼': '27',
    // 넥쏘 계열
    '디올뉴넥쏘': '29', '넥쏘ev': '29', '넥쏘': '29',
    // 포터 계열
    '포터2특장': '31', '포터특장': '31',
    '포터2electric': '32', '포터2ev': '32', '포터electric': '32', '포터ev': '32', '포터전기': '32',
    '포터2': '30', '포터': '30',
    // 베뉴
    '베뉴': '12'
  },
  '기아': {
    // K 시리즈
    'k5hev': '0003', 'k5hybrid': '0003', 'k5하이브리드': '0003', '더뉴k5hev': '0003', '더뉴k5': '0002', 'k5': '0002',
    'k8hev': '0005', 'k8hybrid': '0005', 'k8하이브리드': '0005', '더뉴k8hev': '0005', 'thenewk8hev': '0005', '더뉴k8': '0004', 'thenewk8': '0004', 'k8': '0004',
    'k9': '0006', '더뉴k9': '0006',
    // EV 시리즈
    'ev3': '0007', 'ev4': '0001', 'ev5': '0008', 'ev6': '0012', '더뉴ev6': '0012', 'ev9': '0014', 'pv5': '0016',
    // 니로 계열
    '니로ev': '0009', '니로electric': '0009', '니로일렉트릭': '0009', '니로hev': '0010', '니로hybrid': '0010', '니로하이브리드': '0010', '니로': '0010',
    // 셀토스 (구형: 더 뉴 = 0011, 신형: 디 올 뉴 = 0028)
    '디올뉴셀토스hev': '0028', '디올뉴셀토스하이브리드': '0028', '디올뉴셀토스hybrid': '0028',
    '디올뉴셀토스': '0028',
    '셀토스hev': '0028', '셀토스하이브리드': '0028', '셀토스hybrid': '0028',
    '셀토스': '0011', '더뉴셀토스': '0011',
    // 쏘렌토 계열
    '쏘렌토hev': '0025', '쏘렌토hybrid': '0025', '쏘렌토하이브리드': '0025', '더뉴쏘렌토hev': '0025', '더뉴쏘렌토': '0013', '쏘렌토': '0013',
    // 카니발 계열
    '카니발hev': '0026', '카니발hybrid': '0026', '카니발하이브리드': '0026', '더뉴카니발hev': '0026', '더뉴카니발': '0015', '카니발': '0015',
    // 스포티지 계열
    '스포티지hev': '0024', '스포티지hybrid': '0024', '스포티지하이브리드': '0024', '더뉴스포티지hev': '0024', '더뉴스포티지': '0023', '스포티지': '0023',
    // 모닝/레이
    '모닝': '0021', '더뉴모닝': '0021',
    '레이': '0022', '더뉴레이': '0022', '레이pe': '0022', '더뉴레이pe': '0022',
    '레이ev': '0027', '레이전기': '0027',
    // 봉고
    '봉고ev': '0020', '봉고3ev': '0020', '봉고electric': '0020', '봉고': '0018', '봉고3': '0018',
    // 타스만
    '타스만': '0017', 'tasman': '0017'
  },
  '제네시스': {
    'g80': '001', '디올뉴g80': '001',
    'g90': '002', '신형g90': '002',
    'gv70': '003',
    'gv80coupe': '005', 'gv80쿠페': '005',
    'gv80': '004',
    'g70슈팅브레이크': '007', 'g70shootingbrake': '007',
    '더뉴g70': '006', 'g70': '006',
    'gv60마그마': '008', 'gv60magma': '008',
    'gv60': '009'
  },
  'BMW': {
    '118i': '2001', '120i': '2001', '1시리즈': '2001', '1series': '2001',
    '220i': '2002', '223i': '2003', '2시리즈': '2002', '2series': '2002',
    'm2': '2005',
    '320i': '2006', '330i': '2006', '3시리즈': '2006', '3series': '2006',
    'm3': '2007',
    '420i': '2008', '430i': '2008', '4시리즈': '2008', '4series': '2008',
    'm4': '2009',
    'i4': '2010',
    '520i': '2011', '520d': '2011', '530i': '2011', '530e': '2011', '540i': '2011', '5시리즈': '2011', '5series': '2011',
    'm5': '2012',
    'i5': '2013',
    '630i': '2014', '640i': '2014', '6시리즈': '2014', '6series': '2014',
    '730i': '2015', '740i': '2015', '750i': '2015', '7시리즈': '2015', '7series': '2015',
    'i7': '2016',
    '840i': '2017', '850i': '2017', '8시리즈': '2017', '8series': '2017',
    'm8': '2018',
    'z4': '2019',
    'x1': '2020', 'ix1': '2021',
    'x2': '2022', 'ix2': '2023',
    'x3': '2024', 'ix3': '2025',
    'x4': '2026', 'x4m': '2027',
    'x5': '2028', 'x5m': '2029',
    'x6': '2030', 'x6m': '2031',
    'x7': '2032',
    'xm': '2033',
    'ix': '2034'
  },
  '벤츠': {
    'a180': '4001', 'a200': '4001', 'a220': '4001', 'a250': '4001', 'a35': '4001', 'a45': '4001', 'a클래스': '4001', 'aclass': '4001',
    'c180': '4002', 'c200': '4002', 'c220': '4002', 'c300': '4002', 'c43': '4002', 'c63': '4002', 'c클래스': '4002', 'cclass': '4002',
    'cla180': '4003', 'cla200': '4003', 'cla220': '4003', 'cla250': '4003', 'cla35': '4003', 'cla45': '4003', 'cla클래스': '4003', 'claclass': '4003', 'cla': '4003',
    'cle': '4004',
    'e200': '4005', 'e220': '4005', 'e300': '4005', 'e350': '4005', 'e450': '4005', 'e53': '4005', 'e63': '4005', 'e클래스': '4005', 'eclass': '4005',
    's350': '4006', 's400': '4006', 's450': '4006', 's500': '4006', 's580': '4006', 's63': '4006', 's클래스': '4006', 'sclass': '4006',
    'maybachsl': '4007',
    'maybachs클래스': '4008', 'maybachsclass': '4008',
    'sl클래스': '4009', 'slclass': '4009',
    'amggt': '4010',
    'eqe': '4012',
    'eqs': '4013',
    'maybacheqssuv': '4014',
    'maybachgls': '4015',
    'eqa': '4016', 'eqa250': '4016',
    'eqb': '4017', 'eqb250': '4017', 'eqb300': '4017', 'eqb350': '4017',
    'eqesuv': '4018',
    'eqeamgsuv': '4019', 'eqeamg': '4019',
    'eqssuv': '4020',
    'glb': '4021', 'glb180': '4021', 'glb200': '4021', 'glb250': '4021', 'glb35': '4021', 'glb클래스': '4021', 'glbclass': '4021',
    'gla': '4022', 'gla180': '4022', 'gla200': '4022', 'gla250': '4022', 'gla35': '4022', 'gla45': '4022', 'gla클래스': '4022', 'glaclass': '4022',
    'glc': '4023', 'glc200': '4023', 'glc220': '4023', 'glc300': '4023', 'glc43': '4023', 'glc63': '4023', 'glc클래스': '4023', 'glcclass': '4023',
    'gle': '4024', 'gle300': '4024', 'gle350': '4024', 'gle400': '4024', 'gle450': '4024', 'gle53': '4024', 'gle63': '4024', 'gle클래스': '4024', 'gleclass': '4024',
    'gls': '4025', 'gls400': '4025', 'gls450': '4025', 'gls580': '4025', 'gls63': '4025', 'gls클래스': '4025', 'glsclass': '4025',
    'eqg': '4026',
    'g400': '4027', 'g500': '4027', 'g63': '4027', 'g클래스': '4027', 'gclass': '4027'
  },
  '랜드로버': {
    'evoque': '70', '이보크': '70', '레인지로버이보크': '70',
    'discoverysport': '71', '디스커버리스포츠': '71',
    'discovery': '72', '디스커버리': '72',
    'velar': '73', '벨라': '73',
    'rangeroversport': '74', '레인지로버스포츠': '74',
    'rangerover': '75', '레인지로버': '75',
    'defender': '76', '디펜더': '76'
  },
  'KG모빌리티': {
    '티볼리': '0101', '티볼리에어': '0102',
    '코란도': '0103',
    '액티언': '0104', '액티언hev': '0105',
    '토레스': '0106', '토레스hev': '0107', '토레스evx': '0108',
    '렉스턴뉴아레나': '0109', '렉스턴써밋': '0110', '렉스턴스포츠': '0111', '렉스턴스포츠칸': '0112', '렉스턴': '0109',
    '무쏘q300': '0113', '무쏘스포츠q250': '0114', '무쏘칸q250': '0115', '무쏘ev': '0116', '무쏘': '0113'
  },
  '르노코리아': {
    'sm6': '00001',
    '아르카나': '00002', '아르카나e-tech': '00003', '아르카나etech': '00003', '아르카나hev': '00003',
    '그랑콜레오스': '00004', '콜레오스': '00004', '그랑콜레오스e-tech': '00005', '그랑콜레오스etech': '00005', '그랑콜레오스hev': '00005',
    'qm6': '00006', 'qm6quest': '00009',
    '필랑트': '00007',
    '세닉': '00008'
  },
  '테슬라': {
    'model3': '50', '모델3': '50',
    'models': '51', '모델s': '51',
    'modelx': '52', '모델x': '52',
    'modely': '53', '모델y': '53',
    'cybertruck': '54', '사이버트럭': '54'
  },
  '쉐보레': {
    '트랙스크로스오버': '1001', 'traxcrossover': '1001', 'trax': '1001', '트랙스': '1001',
    '트레일블레이저': '1002', 'trailblazer': '1002',
    '콜로라도': '1003', 'colorado': '1003'
  },
  '폴스타': {
    '폴스타2': '90', 'polestar2': '90', '폴스타2f/l': '90',
    '폴스타4': '91', 'polestar4': '91'
  },
  'BYD': {
    'sealion7': '6001', 'sealion': '6001', '씰라이온7': '6001', '씰라이온': '6001'
  }
}

/**
 * 차량명에서 모델 키워드를 찾아 매칭합니다.
 * HEV/EV/N 등 파워트레인이 다른 경우 정확하게 매칭합니다.
 */
function findBestMatch(vehicleName: string, reverseMapping: Record<string, string>, brand: string): string | null {
  const normalizedName = vehicleName.replace(/\s+/g, '').toLowerCase()

  // 0단계: 직접 키워드 매핑 (가장 우선)
  const directMapping = KEYWORD_TO_CODE[brand]
  if (directMapping) {
    // 긴 키워드부터 확인 (더 구체적인 것 우선)
    const sortedKeywords = Object.keys(directMapping).sort((a, b) => b.length - a.length)
    for (const keyword of sortedKeywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return directMapping[keyword]
      }
    }
  }

  // 1단계: 파워트레인(HEV, EV, N, E-TECH 등) 포함 정확 매칭
  const powertrainPatterns = ['hev', 'hybrid', '하이브리드', 'ev', 'phev', ' n', 'e-tech', 'etech', 'evx', 'electric', '일렉트릭']
  const hasPowertrain = powertrainPatterns.some(p => normalizedName.includes(p.replace(/\s+/g, '').toLowerCase()))

  if (hasPowertrain) {
    // 파워트레인이 있는 경우: HEV/EV 모델 우선 매칭
    for (const [model, code] of Object.entries(reverseMapping)) {
      const normalizedModel = model.replace(/\s+/g, '').toLowerCase()
      // 모델명에 파워트레인이 포함된 경우만
      const modelHasPowertrain = powertrainPatterns.some(p => normalizedModel.includes(p.replace(/\s+/g, '').toLowerCase()))
      if (modelHasPowertrain && normalizedName.includes(normalizedModel)) {
        return code
      }
    }
  }

  // 2단계: 브랜드별 키워드 매칭 (긴 것부터 - HEV/EV 먼저)
  const brandKeywords: Record<string, string[]> = {
    '현대': [
      '아반떼n', '아반떼hev', '아반떼hybrid', '아반떼',
      '쏘나타hev', '쏘나타hybrid', '쏘나타',
      '그랜저hev', '그랜저hybrid', '그랜저',
      '아이오닉6n', '아이오닉6', '아이오닉5n', '아이오닉5', '아이오닉9',
      '코나ev', '코나electric', '코나hev', '코나hybrid', '코나',
      '투싼hev', '투싼hybrid', '투싼',
      '싼타페hev', '싼타페hybrid', '싼타페',
      '팰리세이드hev', '팰리세이드hybrid', '팰리세이드',
      '스타리아hev', '스타리아hybrid', '스타리아',
      '캐스퍼일렉트릭', '캐스퍼electric', '캐스퍼ev', '캐스퍼',
      '넥쏘ev', '넥쏘',
      '포터2특장', '포터특장',
      '포터2electric', '포터2ev', '포터electric', '포터ev', '포터전기',
      '포터2', '포터',
      '베뉴'
    ],
    '기아': [
      'k5hev', 'k5hybrid', 'k5',
      'k8hev', 'k8hybrid', 'k8',
      'k9',
      'ev3', 'ev4', 'ev5', 'ev6', 'ev9', 'pv5',
      '니로ev', '니로electric', '니로hev', '니로hybrid', '니로',
      '셀토스hev', '셀토스hybrid', '셀토스하이브리드', '셀토스',
      '쏘렌토hev', '쏘렌토hybrid', '쏘렌토',
      '카니발hev', '카니발hybrid', '카니발',
      '스포티지hev', '스포티지hybrid', '스포티지',
      '모닝',
      '레이ev', '레이전기', '레이',
      '봉고ev', '봉고3ev', '봉고electric', '봉고',
      '타스만', 'tasman'
    ],
    '제네시스': ['g80', 'g90', 'gv70', 'gv80coupe', 'gv80쿠페', 'gv80', 'g70슈팅브레이크', 'g70shootingbrake', 'g70', 'gv60마그마', 'gv60magma', 'gv60'],
    'BMW': [
      '118i', '120i', '1시리즈', '1series',
      '220i', '223i', '2시리즈액티브투어러', '2시리즈그란쿠페', '2시리즈', '2series',
      'm2',
      '320i', '330i', '3시리즈', '3series',
      'm3',
      '420i', '430i', '4시리즈', '4series',
      'm4',
      'i4',
      '520i', '520d', '530i', '530e', '540i', '5시리즈', '5series',
      'm5',
      'i5',
      '630i', '640i', '6시리즈', '6series',
      '730i', '740i', '750i', '7시리즈', '7series',
      'i7',
      '840i', '850i', '8시리즈', '8series',
      'm8',
      'z4',
      'ix1', 'x1',
      'ix2', 'x2',
      'ix3', 'x3',
      'x4m', 'x4',
      'x5m', 'x5',
      'x6m', 'x6',
      'x7',
      'xm',
      'ix'
    ],
    'KG모빌리티': [
      '티볼리에어', '티볼리',
      '코란도',
      '액티언hev', '액티언hybrid', '액티언',
      '토레스evx', '토레스hev', '토레스hybrid', '토레스',
      '렉스턴뉴아레나', '렉스턴써밋', '렉스턴스포츠칸', '렉스턴스포츠', '렉스턴',
      '무쏘ev', '무쏘q300', '무쏘스포츠', '무쏘칸', '무쏘'
    ],
    '르노코리아': [
      'sm6',
      '아르카나e-tech', '아르카나etech', '아르카나hev', '아르카나hybrid', '아르카나',
      '그랑콜레오스e-tech', '그랑콜레오스etech', '그랑콜레오스hev', '그랑콜레오스hybrid', '그랑콜레오스', '콜레오스',
      'qm6quest', 'qm6',
      '필랑트',
      '세닉'
    ],
    '랜드로버': [
      'evoque', '이보크',
      'discoverysport', '디스커버리스포츠', 'discovery', '디스커버리',
      'velar', '벨라',
      'rangeroversport', '레인지로버스포츠', 'sport', '스포츠',
      'rangerover', '레인지로버',
      'defender', '디펜더'
    ],
    '벤츠': [
      'a180', 'a200', 'a220', 'a250', 'a35', 'a45', 'a클래스', 'a-class', 'aclass',
      'c180', 'c200', 'c220', 'c300', 'c43', 'c63', 'c클래스', 'c-class', 'cclass',
      'cla180', 'cla200', 'cla220', 'cla250', 'cla35', 'cla45', 'cla클래스', 'cla-class', 'claclass', 'cla',
      'cle',
      'e200', 'e220', 'e300', 'e350', 'e450', 'e53', 'e63', 'e클래스', 'e-class', 'eclass',
      's350', 's400', 's450', 's500', 's580', 's63', 's클래스', 's-class', 'sclass',
      'maybachsl', 'maybachsl',
      'maybachs클래스', 'maybachs-class', 'maybachsclass',
      'sl클래스', 'sl-class', 'slclass',
      'amggt',
      'eqesuv', 'eqeamgsuv', 'eqeamg',
      'eqe',
      'eqssuv',
      'eqs',
      'maybacheqssuv',
      'maybachgls',
      'eqa250', 'eqa',
      'eqb250', 'eqb300', 'eqb350', 'eqb',
      'glb180', 'glb200', 'glb250', 'glb35', 'glb클래스', 'glb-class', 'glbclass', 'glb',
      'gla180', 'gla200', 'gla250', 'gla35', 'gla45', 'gla클래스', 'gla-class', 'glaclass', 'gla',
      'glc200', 'glc220', 'glc300', 'glc43', 'glc63', 'glc클래스', 'glc-class', 'glcclass', 'glc',
      'gle300', 'gle350', 'gle400', 'gle450', 'gle53', 'gle63', 'gle클래스', 'gle-class', 'gleclass', 'gle',
      'gls400', 'gls450', 'gls580', 'gls63', 'gls클래스', 'gls-class', 'glsclass', 'gls',
      'eqg', 'eqg-class',
      'g400', 'g500', 'g63', 'g클래스', 'g-class', 'gclass'
    ],
    '쉐보레': [
      '트랙스크로스오버', 'traxcrossover', 'trax', '트랙스',
      '트레일블레이저', 'trailblazer',
      '콜로라도', 'colorado'
    ],
    '테슬라': [
      'model3', '모델3',
      'models', '모델s',
      'modelx', '모델x',
      'modely', '모델y',
      'cybertruck', '사이버트럭'
    ]
  }

  const keywords = brandKeywords[brand] || []

  // HEV/E-TECH 동일 처리를 위한 정규화 함수
  const normalizePowertrain = (s: string) => {
    return s
      .replace(/e-tech/gi, 'hev')
      .replace(/etech/gi, 'hev')
      .replace(/hybrid/gi, 'hev')
      .replace(/하이브리드/g, 'hev')
  }

  // 긴 키워드부터 매칭 (HEV가 먼저 매칭되도록)
  for (const keyword of keywords) {
    if (normalizedName.includes(keyword.toLowerCase())) {
      // 해당 키워드를 포함하는 모델 찾기
      for (const [model, code] of Object.entries(reverseMapping)) {
        const normalizedModel = model.replace(/\s+/g, '').toLowerCase()
        const normalizedKeyword = keyword.toLowerCase()

        // 직접 매칭
        if (normalizedModel.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedModel)) {
          return code
        }

        // HEV/E-TECH 동일 처리 매칭
        const normalizedModelPt = normalizePowertrain(normalizedModel)
        const normalizedKeywordPt = normalizePowertrain(normalizedKeyword)
        if (normalizedModelPt.includes(normalizedKeywordPt) || normalizedKeywordPt.includes(normalizedModelPt)) {
          return code
        }
      }
    }
  }

  // 3단계: 일반 부분 매칭
  for (const [model, code] of Object.entries(reverseMapping)) {
    const normalizedModel = model.replace(/\s+/g, '').toLowerCase()
    if (normalizedName.includes(normalizedModel)) {
      return code
    }
  }

  return null
}

/**
 * 차량 이미지 경로를 반환합니다.
 */
export function getVehicleImagePath(brand: string, vehicleName: string): string | null {
  const folder = BRAND_IMAGE_FOLDERS[brand]
  if (!folder) return null

  let code: string | null = null

  switch (brand) {
    case '현대':
      code = findBestMatch(vehicleName, HYUNDAI_REVERSE, brand)
      break
    case '기아':
      code = findBestMatch(vehicleName, KIA_REVERSE, brand)
      break
    case '제네시스':
      code = findBestMatch(vehicleName, GENESIS_REVERSE, brand)
      break
    case 'BMW':
      code = findBestMatch(vehicleName, BMW_REVERSE, brand)
      break
    case 'KG모빌리티':
      code = findBestMatch(vehicleName, KGM_REVERSE, brand)
      break
    case '르노코리아':
      code = findBestMatch(vehicleName, RENAULT_REVERSE, brand)
      break
    case '랜드로버':
      code = findBestMatch(vehicleName, LANDROVER_REVERSE, brand)
      break
    case '벤츠':
      code = findBestMatch(vehicleName, BENZ_REVERSE, brand)
      break
    case '쉐보레':
      code = findBestMatch(vehicleName, CHEVROLET_REVERSE, brand)
      break
    case '테슬라':
      code = findBestMatch(vehicleName, TESLA_REVERSE, brand)
      break
    case '폴스타':
      code = findBestMatch(vehicleName, POLESTAR_REVERSE, brand)
      break
    case 'BYD':
      code = findBestMatch(vehicleName, BYD_REVERSE, brand)
      break
  }

  if (code) {
    return `${folder}/${code}.png`
  }

  return null
}

/**
 * 브랜드 로고 경로를 반환합니다.
 */
export function getBrandLogoPath(brand: string): string {
  return BRAND_LOGOS[brand] || '/brand-logos/default.png'
}

/**
 * 금융사 로고 경로를 반환합니다.
 */
export function getSourceLogoPath(source: string): string {
  // 정확한 매칭
  if (SOURCE_LOGOS[source]) {
    return SOURCE_LOGOS[source]
  }

  // 부분 매칭 (현대캐피탈_소호_전략_G 같은 케이스)
  for (const [key, value] of Object.entries(SOURCE_LOGOS)) {
    if (source.includes(key) || key.includes(source)) {
      return value
    }
  }

  return '/company-logos/default.png'
}

/**
 * 차량명으로 이미지 매핑에 등록된 공식 모델명을 반환합니다.
 */
export function getOfficialModelName(brand: string, vehicleName: string): string | null {
  let reverseMapping: Record<string, string>
  let models: Record<string, string>

  switch (brand) {
    case '현대':
      reverseMapping = HYUNDAI_REVERSE
      models = HYUNDAI_MODELS
      break
    case '기아':
      reverseMapping = KIA_REVERSE
      models = KIA_MODELS
      break
    case '제네시스':
      reverseMapping = GENESIS_REVERSE
      models = GENESIS_MODELS
      break
    case 'BMW':
      reverseMapping = BMW_REVERSE
      models = BMW_MODELS
      break
    case 'KG모빌리티':
      reverseMapping = KGM_REVERSE
      models = KGM_MODELS
      break
    case '르노코리아':
      reverseMapping = RENAULT_REVERSE
      models = RENAULT_MODELS
      break
    case '랜드로버':
      reverseMapping = LANDROVER_REVERSE
      models = LANDROVER_MODELS
      break
    case '벤츠':
      reverseMapping = BENZ_REVERSE
      models = BENZ_MODELS
      break
    case '쉐보레':
      reverseMapping = CHEVROLET_REVERSE
      models = CHEVROLET_MODELS
      break
    case '테슬라':
      reverseMapping = TESLA_REVERSE
      models = TESLA_MODELS
      break
    case '폴스타':
      reverseMapping = POLESTAR_REVERSE
      models = POLESTAR_MODELS
      break
    case 'BYD':
      reverseMapping = BYD_REVERSE
      models = BYD_MODELS
      break
    default:
      return null
  }

  const code = findBestMatch(vehicleName, reverseMapping, brand)
  if (code) {
    return models[code] || null
  }
  return null
}

/**
 * 이미지 코드로 모델명을 반환합니다.
 */
export function getModelNameByCode(brand: string, code: string): string | null {
  switch (brand) {
    case '현대':
      return HYUNDAI_MODELS[code] || null
    case '기아':
      return KIA_MODELS[code] || null
    case '제네시스':
      return GENESIS_MODELS[code] || null
    case 'BMW':
      return BMW_MODELS[code] || null
    case 'KG모빌리티':
      return KGM_MODELS[code] || null
    case '르노코리아':
      return RENAULT_MODELS[code] || null
    case '랜드로버':
      return LANDROVER_MODELS[code] || null
    case '벤츠':
      return BENZ_MODELS[code] || null
    case '쉐보레':
      return CHEVROLET_MODELS[code] || null
    case '테슬라':
      return TESLA_MODELS[code] || null
    case '폴스타':
      return POLESTAR_MODELS[code] || null
    case 'BYD':
      return BYD_MODELS[code] || null
    default:
      return null
  }
}

/**
 * 브랜드의 모든 차량 목록을 반환합니다.
 */
export function getAllVehiclesByBrand(brand: string): Array<{ code: string; name: string; image: string }> {
  let models: Record<string, string>
  const folder = BRAND_IMAGE_FOLDERS[brand]

  switch (brand) {
    case '현대':
      models = HYUNDAI_MODELS
      break
    case '기아':
      models = KIA_MODELS
      break
    case '제네시스':
      models = GENESIS_MODELS
      break
    case 'BMW':
      models = BMW_MODELS
      break
    case 'KG모빌리티':
      models = KGM_MODELS
      break
    case '르노코리아':
      models = RENAULT_MODELS
      break
    case '랜드로버':
      models = LANDROVER_MODELS
      break
    case '벤츠':
      models = BENZ_MODELS
      break
    case '쉐보레':
      models = CHEVROLET_MODELS
      break
    case '테슬라':
      models = TESLA_MODELS
      break
    case '폴스타':
      models = POLESTAR_MODELS
      break
    case 'BYD':
      models = BYD_MODELS
      break
    default:
      return []
  }

  return Object.entries(models).map(([code, name]) => ({
    code,
    name,
    image: `${folder}/${code}.png`
  }))
}

/**
 * 모든 브랜드 로고 목록을 반환합니다.
 */
export function getAllBrandLogos(): Array<{ brand: string; logo: string }> {
  return Object.entries(BRAND_LOGOS).map(([brand, logo]) => ({
    brand,
    logo
  }))
}

/**
 * 모든 금융사 로고 목록을 반환합니다.
 */
export function getAllSourceLogos(): Array<{ source: string; logo: string }> {
  return Object.entries(SOURCE_LOGOS).map(([source, logo]) => ({
    source,
    logo
  }))
}
