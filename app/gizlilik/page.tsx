'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MusicToggle } from '@/components/ui'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm">Geri</span>
      </button>

      {/* Music Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <MusicToggle />
      </div>

      <div className="pt-20 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-3">
              Gizlilik Politikası
            </h1>
            <p className="text-white/40 text-sm">
              Son güncelleme: Ocak 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-white/70 leading-relaxed">

            {/* Intro */}
            <section className="glass rounded-xl p-6">
              <p className="text-white/80">
                Duygu Evreni, duygularını anonim olarak paylaşabileceğin güvenli bir alan olarak tasarlandı.
                Gizliliğin bizim için çok önemli ve bu sayfada verilerinin nasıl kullanıldığını şeffaf bir şekilde açıklıyoruz.
              </p>
            </section>

            {/* Anonymity */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🌟</span>
                Anonimlik
              </h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <p>
                  <strong className="text-white">Paylaştığın yıldızlar tamamen anonimdir.</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/60">
                  <li>Diğer kullanıcılar yıldızların kime ait olduğunu göremez</li>
                  <li>Kullanıcı adın veya emailin yıldızlarla birlikte gösterilmez</li>
                  <li>Profilindeki &quot;Yıldızlarım&quot; bölümü sadece sana özeldir</li>
                </ul>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Toplanan Veriler
              </h2>
              <div className="glass rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Hesap Bilgileri</h3>
                  <p className="text-white/60 text-sm">
                    Email adresin ve kullanıcı adın sadece hesabına giriş yapabilmen için kullanılır.
                    Google ile giriş yaptığında, Google hesabındaki email adresinle girmiş olursun.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Yıldız İçerikleri</h3>
                  <p className="text-white/60 text-sm">
                    Paylaştığın duygular veritabanımızda saklanır. Bu içerikler anonim olarak
                    diğer kullanıcılara gösterilir.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Kullanım Verileri</h3>
                  <p className="text-white/60 text-sm">
                    Günlük yıldız limitini takip etmek için basit sayaçlar tutarız.
                    Analitik için Vercel Analytics kullanıyoruz (anonim, çerez kullanmaz).
                  </p>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Verilerin Kullanımı
              </h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <p>Verilerini şu amaçlarla kullanıyoruz:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60">
                  <li>Hesabına giriş yapabilmen</li>
                  <li>Günlük yıldız limitini takip etmek (spam önleme)</li>
                  <li>Kendi yıldızlarını profilinde görebilmen</li>
                  <li>Siteyi iyileştirmek için anonim istatistikler</li>
                </ul>
                <p className="text-cyan-400/80 font-medium mt-4">
                  Verilerini asla satmıyoruz veya reklam amaçlı kullanmıyoruz.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🍪</span>
                Çerezler
              </h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <p className="text-white/60">
                  Güvenli giriş ve oturum yönetimi için zorunlu teknik çerezler kullanıyoruz.
                  Bu çerezler sadece hesabına giriş yapabilmen için gereklidir ve reklam amaçlı kullanılmaz.
                </p>
              </div>
            </section>

            {/* Third Parties */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Üçüncü Taraf Hizmetler
              </h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <p className="text-white/60">
                  Siteyi çalıştırmak için güvenilir altyapı hizmetleri kullanıyoruz.
                  Google ile giriş özelliğini kullanırsan, Google hesap bilgilerin üzerinden kimlik doğrulaması yapılır.
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Senin Hakların
              </h2>
              <div className="glass rounded-xl p-6 space-y-3">
                <ul className="list-disc list-inside space-y-2 text-white/60">
                  <li>Verilerinle ilgili bilgi talep edebilirsin</li>
                  <li>Sorularını bize iletebilirsin</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                İletişim
              </h2>
              <div className="glass rounded-xl p-6">
                <p className="text-white/60">
                  Gizlilikle ilgili sorularını{' '}
                  <a
                    href="mailto:kemalyavaass@gmail.com"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    kemalyavaass@gmail.com
                  </a>
                  {' '}adresine iletebilirsin.
                </p>
              </div>
            </section>

          </div>

          {/* Back to universe */}
          <div className="text-center pt-8">
            <button
              onClick={() => router.push('/')}
              className="text-white/40 hover:text-white/60 text-sm transition-colors"
            >
              ← Evrene dön
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
