import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 64,
  height: 64,
}

export const contentType = 'image/png'

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          borderRadius: '50%',
        }}
      >
        <img
          src="https://uxxztunswlxwsqphcpai.supabase.co/storage/v1/object/public/assets/carspirit-logo.png"
          alt="CarSpirit"
          style={{
            width: '80%',
            height: '80%',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
