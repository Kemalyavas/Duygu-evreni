import Link from 'next/link'
import { EMOTIONS } from '@/lib/constants/emotions'

// Görünür, sayfa genelinde iç linkleme footer'ı (SEO: link mesh + keşif).
// Sunucu bileşeni — HTML'e doğrudan basılır, arama motorları takip eder.
export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-bold text-lg bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
              Duygu Evreni
            </p>
            <p className="mt-2 text-sm text-white/50 max-w-xs leading-relaxed">
              Duygularını anonim olarak yıldızlara dönüştürüp paylaşabileceğin 3D
              interaktif bir evren.
            </p>
          </div>

          <nav aria-label="Duygu gezegenleri">
            <p className="text-sm font-semibold text-white/70 mb-3">Duygu Gezegenleri</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {EMOTIONS.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/gezegen/${e.slug}`}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {e.name_tr}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Duygu Evreni</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white/70 transition-colors">
              3D Evren
            </Link>
            <Link href="/gizlilik" className="hover:text-white/70 transition-colors">
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
