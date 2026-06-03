import type { CSSProperties } from 'react'

// Shared "living cosmos" backdrop for every non-universe page (about, planet
// articles, profile, auth...). Replaces the flat purple gradient with layered,
// multi-hue depth: deep-space base + drifting nebula blobs + a deterministic
// starfield + a focusing vignette.
//
// Performance: nebula blobs are pure radial-gradients that fade to transparent
// (NO `filter: blur` — cheap on mobile). Motion is 2-3 slow GPU transforms +
// opacity twinkles, all auto-frozen under prefers-reduced-motion via globals.css.
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

export function CosmicBackground({ accent, accentSecondary }: CosmicBackgroundProps) {
  // Energetic, cohesive multi-hue palette. When an emotion accent is given we
  // lean into it but keep two brand hues so it reads as "emotion-tinted cosmos".
  const [h1, h2, h3, h4] = accent
    ? [accent, accentSecondary ?? '#3B82F6', accent, '#7C3AED']
    : ['#7C3AED', '#2DD4BF', '#EC4899', '#3B82F6'] // violet · teal · magenta · blue

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
            'radial-gradient(125% 95% at 50% 0%, #141033 0%, #0B0A1F 42%, #050610 100%)',
        }}
      />

      {/* Nebula blobs (gradient-soft, no blur filter) */}
      <div
        className="nebula-drift-a absolute -left-[18%] -top-[12%] h-[68vmax] w-[68vmax] rounded-full"
        style={blob(h1, '40')}
      />
      <div
        className="nebula-drift-b absolute -right-[20%] top-[6%] h-[60vmax] w-[60vmax] rounded-full"
        style={blob(h2, '33')}
      />
      <div
        className="nebula-drift-a absolute -bottom-[22%] left-[8%] h-[64vmax] w-[64vmax] rounded-full"
        style={{ ...blob(h3, '33'), animationDelay: '6s' }}
      />
      <div
        className="nebula-drift-b absolute -bottom-[16%] right-[2%] h-[52vmax] w-[52vmax] rounded-full"
        style={{ ...blob(h4, '2e'), animationDelay: '3s' }}
      />

      {/* Starfield */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-white ${s.twinkle ? 'star-twinkle' : ''}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            // expose base opacity to the twinkle keyframe
            ['--star-o' as string]: String(s.opacity),
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

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
