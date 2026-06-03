import type { CSSProperties } from 'react'

// Shared "living cosmos" backdrop for every non-universe page (about, planet
// articles, profile, auth...). Layered, crafted depth — not a flat gradient:
//   deep-space base · drifting aurora band · multi-hue nebula blobs ·
//   occasional meteors · deterministic starfield · film grain · vignette.
//
// Performance: nebula/aurora are pure gradients that fade to transparent (NO
// `filter: blur` — cheap on mobile). Motion is a handful of slow GPU transforms
// + opacity, all auto-frozen under prefers-reduced-motion via globals.css.
//
// `accent` tints the cosmos toward an emotion's color (planet pages pass their
// own color); without it, an energetic brand palette is used.

interface CosmicBackgroundProps {
  accent?: string
  accentSecondary?: string
}

// Deterministic starfield (no Math.random → no hydration mismatch, zero per-render cost)
const STARS = Array.from({ length: 80 }, (_, i) => {
  const left = (i * 73 + i * i * 19) % 100
  const top = (i * 137 + i * i * 7) % 100
  const size = ((i * 13) % 3) * 0.5 + 1 // 1–2px
  const opacity = 0.15 + ((i * 29) % 50) / 100 // 0.15–0.65
  const twinkle = i % 6 === 0
  const delay = (i % 10) * 0.5
  return { left, top, size, opacity, twinkle, delay }
})

// Occasional meteors — spread out via long, varied delays (not a constant rain)
const METEORS = Array.from({ length: 11 }, (_, i) => ({
  top: (i * 41) % 55, // 0–54%
  left: 14 + ((i * 53) % 78), // 14–92%
  delay: (i * 1.9) % 15, // 0–15s apart
  duration: 4 + (i % 5), // 4–8s
}))

export function CosmicBackground({ accent, accentSecondary }: CosmicBackgroundProps) {
  // Energetic, cohesive multi-hue palette. With an emotion accent we lean into
  // it but keep two brand hues so it reads as "emotion-tinted cosmos".
  const [h1, h2, h3, h4] = accent
    ? [accent, accentSecondary ?? '#56D4D9', accent, '#3457B8']
    : ['#FFB14E', '#56D4D9', '#FF6F61', '#3457B8'] // amber · ice-cyan · coral · deep blue

  const blob = (color: string, alpha: string): CSSProperties => ({
    background: `radial-gradient(circle, ${color}${alpha} 0%, ${color}00 70%)`,
  })

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep-space base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 0%, #0F1424 0%, #0A0D18 45%, #05070D 100%)',
        }}
      />

      {/* Aurora band — slow living color drift */}
      <div
        className="aurora-shift absolute -top-[12%] left-1/2 h-[55vmax] w-[170%] -translate-x-1/2 opacity-45"
        style={{
          background: `linear-gradient(100deg, transparent 8%, ${h1}33 28%, ${h2}2b 48%, ${h3}33 68%, transparent 92%)`,
        }}
      />

      {/* Nebula blobs (gradient-soft, no blur filter) */}
      <div className="nebula-drift-a absolute -left-[18%] -top-[12%] h-[68vmax] w-[68vmax] rounded-full" style={blob(h1, '40')} />
      <div className="nebula-drift-b absolute -right-[20%] top-[6%] h-[60vmax] w-[60vmax] rounded-full" style={blob(h2, '33')} />
      <div className="nebula-drift-a absolute -bottom-[22%] left-[8%] h-[64vmax] w-[64vmax] rounded-full" style={{ ...blob(h3, '33'), animationDelay: '6s' }} />
      <div className="nebula-drift-b absolute -bottom-[16%] right-[2%] h-[52vmax] w-[52vmax] rounded-full" style={{ ...blob(h4, '2e'), animationDelay: '3s' }} />

      {/* Meteors */}
      {METEORS.map((m, i) => (
        <span
          key={`m${i}`}
          className="meteor"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}

      {/* Starfield */}
      {STARS.map((s, i) => (
        <span
          key={`s${i}`}
          className={`absolute rounded-full bg-white ${s.twinkle ? 'star-twinkle' : ''}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            ['--star-o' as string]: String(s.opacity),
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Film grain — subtle analog texture */}
      <div className="cosmic-grain absolute inset-0 opacity-[0.06] mix-blend-soft-light" />

      {/* Vignette — focuses content, deepens edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 90% at 50% 35%, transparent 45%, rgba(5,6,16,0.72) 100%)',
        }}
      />
    </div>
  )
}
