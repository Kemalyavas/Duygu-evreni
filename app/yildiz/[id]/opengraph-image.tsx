import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Duygu Evreni: bir duygu, evrende bir yıldız'
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

  // Deterministic, well-scattered starfield (quadratic mix avoids diagonal banding)
  const stars = Array.from({ length: 70 }, (_, i) => {
    const left = (i * 167 + i * i * 13) % 100
    const top = (i * 97 + i * i * 29) % 100
    const sizePx = ((i * 17) % 3) + 1.5
    const opacity = 0.2 + ((i * 7) % 60) / 100
    return { left: `${left}%`, top: `${top}%`, sizePx, opacity }
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
          justifyContent: 'flex-start',
          paddingTop: 78,
          paddingBottom: 52,
          background: 'linear-gradient(135deg, #06070f 0%, #0A0E27 45%, #06070f 100%)',
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
              width: st.sizePx,
              height: st.sizePx,
              borderRadius: '50%',
              background: 'white',
              opacity: st.opacity,
            }}
          />
        ))}

        {/* emotion-colored ambient glow behind the orb */}
        <div
          style={{
            position: 'absolute',
            width: 720,
            height: 720,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}3a 0%, ${color}12 45%, transparent 70%)`,
            top: -130,
          }}
        />

        {/* glowing planet orb (the emotion) */}
        <div
          style={{
            width: 232,
            height: 232,
            borderRadius: '50%',
            background: `radial-gradient(circle at 34% 30%, #ffffff 0%, ${color} 34%, ${color}cc 66%, ${color}44 100%)`,
            boxShadow: `0 0 120px 22px ${color}66, inset -26px -26px 64px rgba(0,0,0,0.55)`,
            display: 'flex',
          }}
        />

        {/* emotion name */}
        <div
          style={{
            marginTop: 52,
            fontSize: 92,
            fontWeight: 800,
            color: 'white',
            letterSpacing: -1,
            textShadow: `0 0 44px ${color}aa`,
            display: 'flex',
          }}
        >
          {name}
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 10,
            fontSize: 30,
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
          }}
        >
          evrende bir yıldız
        </div>

        {/* brand wordmark — pinned to the bottom of the flow (no overlap) */}
        <div
          style={{
            marginTop: 'auto',
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
