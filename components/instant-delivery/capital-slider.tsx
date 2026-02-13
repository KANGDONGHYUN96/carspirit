'use client'

import Image from 'next/image'

// 슬라이더에 표시할 금융사 로고 (중복 제거)
const UNIQUE_LOGOS = [
  { source: 'KB캐피탈', logo: '/company-logos/kb.png', width: 100, height: 45, offsetY: 0 },
  { source: '현대캐피탈', logo: '/company-logos/hyundai-capital.png', width: 100, height: 45, offsetY: 0 },
  { source: 'BNK캐피탈', logo: '/company-logos/bnk.png', width: 100, height: 45, offsetY: 0 },
  { source: 'IM캐피탈', logo: '/company-logos/im.png', width: 100, height: 45, offsetY: 0 },
  { source: 'MG캐피탈', logo: '/company-logos/mg.png', width: 100, height: 45, offsetY: 0 },
  { source: '메리츠캐피탈', logo: '/company-logos/meritz.png', width: 100, height: 45, offsetY: 0 },
  { source: 'JB우리캐피탈', logo: '/company-logos/jb.png', width: 100, height: 45, offsetY: 0 },
  { source: '롯데렌터카', logo: '/company-logos/lotte-rent.png', width: 100, height: 45, offsetY: 0 },
  { source: '롯데캐피탈', logo: '/company-logos/lotte-capital.png', width: 100, height: 45, offsetY: 0 },
  { source: '오릭스캐피탈', logo: '/company-logos/orix.png', width: 100, height: 45, offsetY: 0 },
  { source: '신한카드', logo: '/company-logos/shinhan.png', width: 100, height: 45, offsetY: 0 },
  { source: 'SK렌터카', logo: '/company-logos/sk.png', width: 80, height: 36, offsetY: -8 },
  { source: '농협캐피탈', logo: '/company-logos/nh.png', width: 100, height: 45, offsetY: 0 },
  { source: '우리금융캐피탈', logo: '/company-logos/woori.png', width: 100, height: 45, offsetY: 0 },
  { source: '하나캐피탈', logo: '/company-logos/hana.png', width: 120, height: 55, offsetY: 0 },
]

export default function CapitalSlider() {
  // 무한 스크롤을 위해 로고 배열 복제
  const duplicatedLogos = [...UNIQUE_LOGOS, ...UNIQUE_LOGOS]

  return (
    <div className="relative w-full overflow-hidden bg-gray-50 py-6 rounded-xl mb-6">
      <div
        className="flex gap-12 animate-scroll"
        style={{
          width: `${duplicatedLogos.length * 140}px`
        }}
      >
        {duplicatedLogos.map((item, index) => (
          <div
            key={`${item.source}-${index}`}
            className="flex-shrink-0 w-[120px] h-[50px] flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ transform: `translateY(${item.offsetY}px)` }}
          >
            <Image
              src={item.logo}
              alt={item.source}
              width={item.width}
              height={item.height}
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* 좌우 그라데이션 */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
