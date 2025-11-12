import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 64,
  height: 64,
}

export const contentType = 'image/png'

export default async function Icon() {
  // Supabase Storage에서 로고 가져오기
  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/favilogo.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={logoUrl}
          alt="CarSpirit"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
