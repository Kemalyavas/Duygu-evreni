import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Duygu Evreni — bir duygu, evrende bir yıldız'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = { params: Promise<{ id: string }> }

// Public, cookieless read of the star's planet (color + name) for the card.
// No user text is ever rendered — the card is branded by EMOTION only (privacy).
async function getEmotion(id: string): Promise<{ name: string; color: string }> {
  const fallback = { name: 'Duygu Evreni', color: '#8b5cf6' }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return fallback
  try {
    const res = await fetch(
      `${url}/rest/v1/stars?id=eq.${encodeURIComponent(id)}&select=planets(name_tr,color)`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (!res.ok) return fallback
    const rows = (await res.json()) as Array<{ planets?: { name_tr?: string; color?: string } }>
    const planet = rows?.[0]?.planets
    if (!planet?.name_tr || !planet?.color) return fallback
    return { name: planet.name_tr, color: planet.color }
  } catch {
    return fallback
  }
}

export default async function Image({ params }: Params) {
  const { id } = await params
  const { name, color } = await getEmotion(id)

  // Deterministic starfield (no Math.random → stable image / cacheable)
  const stars = Array.from({ length: 60 }, (_, i) => {
    const a = (i * 99.13) % 100
    const b = (i * 47.71) % 100
    const s = ((i * 13) % 3) + 1.5
    const o = 0.25 + ((i * 7) % 60) / 100
    return { left: `${a}%`, top: `${b}%`, size: s, opacity: o }
  })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #06070f 0%, #0A0E27 45%, #06070f 100%)',
          position: 'relative',
        }}
      >
        {/* starfield */}
        {stars.map((st, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: st.left,
              top: st.top,
              width: st.size,
              height: st.size,
              borderRadius: '50%',
              background: 'white',
              opacity: st.opacity,
            }}
          />
        ))}

        {/* emotion-colored ambient glow */}
        <div
          style={{
            position: 'absolute',
            width: 760,
            height: 760,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}40 0%, ${color}14 45%, transparent 70%)`,
            top: 100,
          }}
        />

        {/* glowing planet orb (the emotion) */}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle at 34% 30%, #ffffff 0%, ${color} 34%, ${color}cc 66%, ${color}44 100%)`,
            boxShadow: `0 0 130px 24px ${color}66, inset -28px -28px 70px rgba(0,0,0,0.55)`,
            display: 'flex',
          }}
        />

        {/* emotion name */}
        <div
          style={{
            marginTop: 56,
            fontSize: 88,
            fontWeight: 800,
            color: 'white',
            letterSpacing: -1,
            textShadow: `0 0 40px ${color}aa`,
            display: 'flex',
          }}
        >
          {name}
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 8,
            fontSize: 30,
            color: 'rgba(255,255,255,0.62)',
            display: 'flex',
          }}
        >
          evrende bir yıldız
        </div>

        {/* brand wordmark */}
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            fontSize: 30,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #c084fc, #f472b6, #60a5fa)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}
        >
          Duygu Evreni
        </div>
      </div>
    ),
    { ...size }
  )
}
