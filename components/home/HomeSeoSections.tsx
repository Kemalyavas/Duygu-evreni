'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { EMOTIONS } from '@/lib/constants/emotions'
import { SiteFooter } from '@/components/SiteFooter'
import { CosmicBackground } from '@/components/CosmicBackground'
import { useTranslation } from '@/lib/i18n'

// Visible, server-rendered marketing content for /hakkinda.
//
// i18n note: we select content by `language` (NOT the t() helper). Before the
// LanguageProvider mounts (i.e. during SSR and the first client render) the
// context returns language='tr' AND a passthrough t() that echoes the key —
// so using t() here would emit raw keys into the SSR HTML and wreck Turkish
// SEO. Selecting from this bilingual object keeps SSR Turkish (crawlers + the
// FAQ schema stay tr_TR, matching the page's canonical/locale) while EN users
// get English after hydration with no mismatch (SSR tr === first client render).

interface StepContent {
  title: string
  desc: string
}
interface FaqContent {
  q: string
  a: string
}
interface SeoContent {
  enter3d: string
  introTitle: string
  introBody: ReactNode
  planetsTitle: string
  planetsSubtitle: string
  cardFallback: (name: string) => string
  taglines: Record<string, string>
  howTitle: string
  steps: StepContent[]
  faqTitle: string
  faqs: FaqContent[]
}

const CONTENT: Record<'tr' | 'en', SeoContent> = {
  tr: {
    enter3d: '3D Evrene Gir',
    introTitle: 'Duygu Evreni Nedir?',
    introBody: (
      <>
        Duygu Evreni, içindekileri <strong>anonim</strong> olarak paylaşabileceğin
        3D interaktif bir duygu evrenidir. Aşk, mutluluk, umut, özlem, hüzün, öfke,
        korku, pişmanlık, huzur ve depresyon için ayrı gezegenler var. Hislerini
        yaz, evrende parlayan bir yıldıza dönüştür; başkalarının duygularını oku ve
        yalnız olmadığını hisset.
      </>
    ),
    planetsTitle: 'Duygu Gezegenleri',
    planetsSubtitle: 'Her gezegen bir duyguyu temsil eder. Keşfetmek istediğin duyguyu seç.',
    cardFallback: (name) => `${name} duygularını paylaş`,
    taglines: {
      mutluluk: 'Sevincini ve mutlu anlarını paylaş',
      ask: 'Aşk ve sevgi dolu duygularını yaz',
      umut: 'Geleceğe dair umut ve dileklerin',
      huzur: 'Sükunet ve iç huzuru anların',
      ozlem: 'Özlem ve hasret dolu sözlerin',
      huzun: 'Hüzün ve üzüntünü paylaş',
      pismanlik: 'Pişmanlıklarını ve keşkelerini dök',
      korku: 'Korku ve kaygılarını anlat',
      ofke: 'Öfke ve kızgınlığını boşalt',
      depresyon: 'Ağır ruh hâllerinde yalnız değilsin',
    },
    howTitle: 'Nasıl çalışır?',
    steps: [
      {
        title: 'Bir gezegen seç',
        desc: 'Her gezegen bir duyguyu temsil eder. Hissine en yakın olanı seç.',
      },
      {
        title: 'Duygunu yaz',
        desc: 'Birkaç cümleyle içindekini yaz; paylaşımın anonim bir yıldıza dönüşür.',
      },
      {
        title: 'Keşfet ve bağ kur',
        desc: 'Başkalarının yıldızlarını oku, istersen anonim olarak mesajlaş.',
      },
    ],
    faqTitle: 'Sık Sorulan Sorular',
    faqs: [
      {
        q: 'Duygu Evreni nedir?',
        a: 'Duygu Evreni, duygularını anonim olarak yıldızlara dönüştürüp paylaşabileceğin 3D interaktif bir platformdur. Her gezegen bir duyguyu temsil eder; paylaştığın her his evrende parlayan bir yıldız olur.',
      },
      {
        q: 'Duygu Evreni nasıl çalışır?',
        a: 'Ücretsiz kayıt olursun, bir duygu gezegeni seçersin, içindekileri birkaç cümleyle yazarsın ve paylaşımın anonim bir yıldıza dönüşür. Aynı gezegende başkalarının duygularını da okuyabilirsin.',
      },
      {
        q: 'Paylaşımlar gerçekten anonim mi?',
        a: 'Evet. Yıldızlarda yalnızca duygu metni ve tarih görünür; kim olduğun gizli kalır. Dilersen biriyle anonim olarak mesajlaşmaya başlayabilirsin.',
      },
      {
        q: 'Duygu Evreni ücretsiz mi?',
        a: 'Evet, tamamen ücretsizdir. Kayıt olduktan sonra her gün belirli sayıda yıldız paylaşabilir, sınırsızca başkalarının duygularını okuyabilirsin.',
      },
    ],
  },
  en: {
    enter3d: 'Enter the 3D Universe',
    introTitle: 'What Is Emotion Universe?',
    introBody: (
      <>
        Emotion Universe is a 3D interactive universe of feelings where you can share
        what&apos;s inside you <strong>anonymously</strong>. There are separate planets
        for love, happiness, hope, longing, sadness, anger, fear, regret, peace and
        depression. Write your feelings, turn them into a star shining in the universe;
        read other people&apos;s emotions and feel that you are not alone.
      </>
    ),
    planetsTitle: 'Emotion Planets',
    planetsSubtitle: 'Each planet represents an emotion. Choose the one you want to explore.',
    cardFallback: (name) => `Share your ${name.toLowerCase()} feelings`,
    taglines: {
      mutluluk: 'Share your joy and happy moments',
      ask: 'Write your feelings full of love and affection',
      umut: 'Your hopes and wishes for the future',
      huzur: 'Your moments of calm and inner peace',
      ozlem: 'Your words full of longing and yearning',
      huzun: 'Share your sadness and sorrow',
      pismanlik: 'Pour out your regrets and what-ifs',
      korku: 'Tell us about your fears and worries',
      ofke: 'Let out your anger and frustration',
      depresyon: 'You are not alone in your heaviest moods',
    },
    howTitle: 'How Does It Work?',
    steps: [
      {
        title: 'Choose a planet',
        desc: 'Each planet represents an emotion. Pick the one closest to how you feel.',
      },
      {
        title: 'Write your feeling',
        desc: 'Write what is inside you in a few sentences; your post becomes an anonymous star.',
      },
      {
        title: 'Explore and connect',
        desc: "Read other people's stars, and message anonymously if you want to.",
      },
    ],
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      {
        q: 'What is Emotion Universe?',
        a: 'Emotion Universe is a 3D interactive platform where you turn your feelings into stars and share them anonymously. Each planet represents an emotion; every feeling you share becomes a star shining in the universe.',
      },
      {
        q: 'How does Emotion Universe work?',
        a: 'You sign up for free, choose an emotion planet, write what is inside you in a few sentences, and your post becomes an anonymous star. You can also read other people’s emotions on the same planet.',
      },
      {
        q: 'Are the posts really anonymous?',
        a: 'Yes. A star shows only the feeling text and the date; who you are stays hidden. If you wish, you can start messaging someone anonymously.',
      },
      {
        q: 'Is Emotion Universe free?',
        a: 'Yes, it is completely free. After signing up you can share a set number of stars each day and read other people’s emotions without any limit.',
      },
    ],
  },
}

// Orchestrated entrance — staggered reveal (respects reduced-motion via the
// app-wide <MotionConfig reducedMotion="user">).
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

// Desktop pointer spotlight: track the cursor over the planet grid as CSS vars.
function trackSpotlight(e: React.MouseEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export function HomeSeoSections() {
  const { language } = useTranslation()
  const c = CONTENT[language === 'en' ? 'en' : 'tr']
  const isEn = language === 'en'

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="relative min-h-dvh text-white">
      <CosmicBackground />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <div className="relative z-10">
        {/* Sticky glass header */}
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="flex h-16 items-center justify-between px-3 sm:px-5">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Duygu Evreni" width={36} height={36} />
              <span className="bg-gradient-to-r from-[#FFD79A] via-[#FFB14E] to-[#FF6F61] bg-clip-text text-xl font-bold text-transparent">Duygu Evreni</span>
            </Link>
            <Link
              href="/"
              className="rounded-full bg-gradient-to-r from-[#3366E8] to-[#2CB6D6] shadow-[0_6px_24px_-6px_rgba(51,102,232,0.5)] hover:shadow-[0_10px_34px_-6px_rgba(51,102,232,0.7)] px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.03]"
            >
              {c.enter3d}
            </Link>
          </div>
        </header>

        {/* Hero / intro */}
        <motion.section
          id="hakkinda"
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-4xl px-4 pb-16 pt-20 sm:pt-28"
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-7xl"
          >
            {c.introTitle}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl"
          >
            {c.introBody}
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3366E8] to-[#2CB6D6] shadow-[0_6px_24px_-6px_rgba(51,102,232,0.5)] hover:shadow-[0_10px_34px_-6px_rgba(51,102,232,0.7)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.03]"
            >
              {c.enter3d}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </motion.section>

        {/* Emotion planets — each card themed to its own color, with a desktop cursor spotlight */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="text-3xl font-semibold text-white sm:text-4xl"
          >
            {c.planetsTitle}
          </motion.h2>
          <p className="mb-8 mt-2 text-white/60">{c.planetsSubtitle}</p>

          <div className="group/grid relative" onMouseMove={trackSpotlight}>
            <div
              className="pointer-spotlight pointer-events-none absolute -inset-3 z-20 rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover/grid:opacity-100"
              style={{ background: 'radial-gradient(320px circle at var(--mx) var(--my), rgba(255,255,255,0.07), transparent 72%)' }}
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {EMOTIONS.map((e) => {
                const name = isEn ? e.name_en : e.name_tr
                return (
                  <motion.div key={e.slug} variants={fadeUp}>
                    <Link
                      href={`/gezegen/${e.slug}`}
                      className="group relative block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                    >
                      {/* emotion-tinted glow */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-45 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: `radial-gradient(150px circle at 12% -10%, ${e.color}26, transparent 60%)` }}
                      />
                      {/* top accent line in the emotion's color */}
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: `linear-gradient(90deg, transparent, ${e.color}, transparent)` }}
                      />
                      <div className="relative">
                        <div className="mb-2 flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: e.color, boxShadow: `0 0 12px 2px ${e.color}aa` }}
                          />
                          <h3 className="text-lg font-semibold">{name}</h3>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="ml-auto h-4 w-4 -translate-x-1 text-white/40 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm leading-relaxed text-white/60">
                          {c.taglines[e.slug] ?? c.cardFallback(name)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mb-8 text-3xl font-semibold text-white sm:text-4xl"
          >
            {c.howTitle}
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-5 sm:grid-cols-3"
          >
            {c.steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/20"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB14E] to-[#FF6F61] text-lg font-bold text-[#1a1205]"
                  style={{ boxShadow: '0 0 24px rgba(255,140,80,0.4)' }}
                >
                  {i + 1}
                </div>
                <h3 className="mb-1.5 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mb-6 text-3xl font-semibold text-white sm:text-4xl"
          >
            {c.faqTitle}
          </motion.h2>
          <div className="space-y-3">
            {c.faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-white/20"
              >
                <h3 className="mb-1.5 font-semibold text-white/90">{f.q}</h3>
                <p className="text-sm leading-relaxed text-white/65">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
