/**
 * JSON-LD Structured Data Components for SEO & GEO
 *
 * These schemas help search engines and AI systems understand your content:
 * - WebSite: Basic site information
 * - WebApplication: App-specific details
 * - FAQPage: Common questions (boosts GEO visibility)
 * - Organization: Brand information
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

// Website Schema
export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Duygu Evreni',
    alternateName: ['Duygu Evreni', 'Emotion Universe'],
    url: siteUrl,
    description: 'Duygularını yıldızlara dönüştür ve evrende paylaş. 3D interaktif bir evren deneyimi ile duygularını keşfet.',
    inLanguage: 'tr-TR',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Web Application Schema
export function WebApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Duygu Evreni',
    url: siteUrl,
    description: 'Duygularını yıldızlara dönüştür ve 3D interaktif evrende paylaş. Her duygu bir yıldız, her gezegen bir duygu kategorisi.',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. WebGL support recommended.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
    featureList: [
      '3D interaktif evren deneyimi',
      'Duygu paylaşımı ve keşfi',
      'Anonim duygu yazma',
      '10 farklı duygu gezegeni',
      'Gerçek zamanlı yıldız animasyonları',
    ],
    screenshot: `${siteUrl}/opengraph-image`,
    author: {
      '@type': 'Organization',
      name: 'Duygu Evreni',
      url: siteUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQ Schema for GEO Optimization
export function FAQJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Duygu Evreni nedir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Duygu Evreni, duygularınızı yıldızlara dönüştürebildiğiniz 3D interaktif bir web uygulamasıdır. Umut, sevgi, mutluluk, üzüntü, öfke ve korku gibi farklı duygu kategorileri için gezegenler bulunur. Her paylaşılan duygu evrende bir yıldız olarak görünür.',
        },
      },
      {
        '@type': 'Question',
        name: 'Duygu Evreni nasıl kullanılır?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Duygu Evreni\'ni kullanmak için: 1) Siteye girin ve ücretsiz kayıt olun, 2) 3D evrende gezinip bir gezegen seçin, 3) "Yıldız Oluştur" butonuna tıklayarak duygularınızı yazın, 4) Başkalarının yıldızlarına tıklayarak duygularını okuyun.',
        },
      },
      {
        '@type': 'Question',
        name: 'Duygu Evreni ücretsiz mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Evet, Duygu Evreni tamamen ücretsizdir. Kayıt olarak sınırsız duygu okuyabilir ve günlük yıldız oluşturma hakkınızı kullanabilirsiniz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Paylaştığım duygular anonim mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Evet, Duygu Evreni\'nde paylaşılan tüm duygular anonimdir. Yıldızlarda sadece duygu metni ve oluşturulma tarihi görünür, kullanıcı bilgileri gizlidir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Duygu Evreni\'nde kaç gezegen var?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Duygu Evreni\'nde 10 duygu gezegeni bulunur: Mutluluk, Aşk, Umut, Özlem, Hüzün, Öfke, Korku, Pişmanlık, Huzur ve Depresyon. Her gezegen ilgili duygu kategorisindeki yıldızları barındırır.',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Organization Schema
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Duygu Evreni',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Duygu paylaşım platformu - Duygularını yıldızlara dönüştür',
    sameAs: [
      // Add social media links when available
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Combined JsonLd for homepage
export function HomePageJsonLd() {
  return (
    <>
      <WebsiteJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd />
      <OrganizationJsonLd />
    </>
  )
}

// Planet page specific schema
interface PlanetJsonLdProps {
  planetName: string
  planetDescription: string
  starCount: number
}

export function PlanetJsonLd({ planetName, planetDescription, starCount }: PlanetJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${planetName} - Duygu Evreni`,
    description: planetDescription,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Duygu Evreni',
      url: siteUrl,
    },
    about: {
      '@type': 'Thing',
      name: planetName,
      description: `${planetName} kategorisindeki duygular. ${starCount} yıldız paylaşıldı.`,
    },
    numberOfItems: starCount,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
