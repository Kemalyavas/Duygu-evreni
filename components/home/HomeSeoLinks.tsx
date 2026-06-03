import Link from 'next/link'
import { EMOTIONS } from '@/lib/constants/emotions'

// Ana sayfa (3D evren) görsel olarak içeriksizdir. Bu blok ekranda GÖRÜNMEZ
// (sr-only) ama HTML'e basılır: arama motorlarına bir H1, kısa bir tanım ve
// tüm içerik sayfalarına (gezegenler + /hakkinda) crawl edilebilir iç linkler
// sağlar. Böylece 3D deneyim hiç bozulmadan ana sayfa otoritesi dağıtılır.
//
// ÖNEMLI: Suspense DIŞINDA render edilmeli (useSearchParams fallback'i gizlemesin).
export function HomeSeoLinks() {
  return (
    <section className="sr-only" aria-hidden="false">
      <h1>Duygu Evreni: Duygularını Yıldızlara Dönüştür</h1>
      <p>
        Duygu Evreni, duygularını anonim olarak yıldızlara dönüştürüp
        paylaşabileceğin 3D interaktif bir platformdur. Aşk, mutluluk, umut,
        özlem, hüzün, öfke, korku, pişmanlık, huzur ve depresyon gezegenlerini
        keşfet.
      </p>
      <nav aria-label="Duygu gezegenleri">
        <ul>
          {EMOTIONS.map((e) => (
            <li key={e.slug}>
              <Link href={`/gezegen/${e.slug}`}>{e.name_tr} duyguları</Link>
            </li>
          ))}
        </ul>
      </nav>
      <p>
        <Link href="/hakkinda">Duygu Evreni nedir ve nasıl çalışır?</Link>
      </p>
      <p>
        <Link href="/gizlilik">Gizlilik Politikası</Link>
      </p>
    </section>
  )
}
