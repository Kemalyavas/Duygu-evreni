import Link from 'next/link'
import { EMOTIONS } from '@/lib/constants/emotions'
import { SiteFooter } from '@/components/SiteFooter'

// Ana sayfada 3D hero'nun ALTINDA yer alan, sunucuda render edilen görünür içerik.
// Amaç: ana sayfanın arama motorları için gerçek metin + iç link içermesi
// (3D <canvas> içeriği taranamadığı için ana sayfa şu ana dek SEO'da boştu).

const TAGLINES: Record<string, string> = {
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
}

const STEPS = [
  {
    n: 1,
    title: 'Bir gezegen seç',
    desc: 'Her gezegen bir duyguyu temsil eder. Hissine en yakın olanı seç.',
  },
  {
    n: 2,
    title: 'Duygunu yaz',
    desc: 'Birkaç cümleyle içindekini yaz; paylaşımın anonim bir yıldıza dönüşür.',
  },
  {
    n: 3,
    title: 'Keşfet ve bağ kur',
    desc: 'Başkalarının yıldızlarını oku, istersen anonim olarak mesajlaş.',
  },
]

const HOME_FAQS = [
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
]

export function HomeSeoSections() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="relative bg-gradient-to-b from-black to-[#0A0E27] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      {/* Hakkında / intro */}
      <section id="hakkinda" className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold mb-5">
          Duygu Evreni Nedir?
        </h1>
        <p className="text-lg text-white/75 leading-relaxed max-w-3xl">
          Duygu Evreni, içindekileri <strong>anonim</strong> olarak paylaşabileceğin
          3D interaktif bir duygu evrenidir. Aşk, mutluluk, umut, özlem, hüzün, öfke,
          korku, pişmanlık, huzur ve depresyon için ayrı gezegenler var. Hislerini
          yaz, evrende parlayan bir yıldıza dönüştür; başkalarının duygularını oku ve
          yalnız olmadığını hisset.
        </p>
      </section>

      {/* Duygu gezegenleri */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-2">Duygu Gezegenleri</h2>
        <p className="text-white/60 mb-8">
          Her gezegen bir duyguyu temsil eder. Keşfetmek istediğin duyguyu seç.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EMOTIONS.map((e) => (
            <Link
              key={e.slug}
              href={`/gezegen/${e.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: e.color }}
                />
                <h3 className="font-semibold text-lg">{e.name_tr}</h3>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                {TAGLINES[e.slug] ?? `${e.name_tr} duygularını paylaş`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-8">Nasıl çalışır?</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold">
                {s.n}
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SSS */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Sık Sorulan Sorular</h2>
        <div className="space-y-5">
          {HOME_FAQS.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-white/90 mb-1.5">{f.q}</h3>
              <p className="text-white/65 leading-relaxed text-sm">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
