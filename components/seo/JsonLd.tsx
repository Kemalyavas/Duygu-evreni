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

// Combined JsonLd for the site (WebSite + WebApplication + Organization).
// NOTE: FAQPage schema intentionally lives ONLY on pages with matching visible FAQ
// content (/hakkinda and /gezegen/[slug]) — not site-wide — to avoid duplicate
// FAQPage blocks on every route, which Google may flag.
export function HomePageJsonLd() {
  return (
    <>
      <WebsiteJsonLd />
      <WebApplicationJsonLd />
      <OrganizationJsonLd />
    </>
  )
}
