'use client'

import Image from 'next/image'

const CAPITAL_LOGOS = [
  { name: 'BNK캐피탈', src: '/capital-logos/bnk.png' },
  { name: 'JB우리캐피탈', src: '/capital-logos/jb.png' },
  { name: '기아', src: '/capital-logos/kia.png' },
  { name: '농협캐피탈', src: '/capital-logos/nh.png' },
  { name: '롯데캐피탈', src: '/capital-logos/lotte-capital.png' },
  { name: '롯데렌터카', src: '/capital-logos/lotte-rent.png' },
  { name: '현대캐피탈', src: '/capital-logos/hyundai-capital.png' },
  { name: '현대', src: '/capital-logos/hyundai.png' },
  { name: '우리금융캐피탈', src: '/capital-logos/woori.png' },
  { name: '오릭스캐피탈', src: '/capital-logos/orix.png' },
  { name: 'KB캐피탈', src: '/capital-logos/kb.png' },
  { name: '신한카드', src: '/capital-logos/shinhan.png' },
  { name: 'IM캐피탈', src: '/capital-logos/im.png' },
  { name: 'MG캐피탈', src: '/capital-logos/mg.png' },
]

export default function CapitalSlider() {
  // 3번 복사해서 더 부드럽게
  const allLogos = [...CAPITAL_LOGOS, ...CAPITAL_LOGOS, ...CAPITAL_LOGOS]

  return (
    <div className="bg-white rounded-xl p-6 mb-8 shadow-sm overflow-hidden">
      <div className="slider-wrapper">
        <div className="slider-track">
          {allLogos.map((capital, index) => (
            <div key={index} className="slide">
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-24">
                  <Image
                    src={capital.src}
                    alt={capital.name}
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .slider-wrapper {
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .slider-track {
          display: flex;
          width: fit-content;
          animation: scroll 30s linear infinite;
        }

        .slide {
          flex-shrink: 0;
          width: 200px;
          padding: 10px;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-200px * 14)); /* 14개 로고 너비만큼 이동 */
          }
        }

        .slider-wrapper:hover .slider-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
