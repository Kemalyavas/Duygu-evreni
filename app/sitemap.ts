import { MetadataRoute } from 'next'
import { EMOTION_SLUGS } from '@/lib/constants/emotions'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

// İçerik değiştiğinde güncelle. Sabit tarih, her build'de "now" üretmekten
// daha güvenilir bir lastmod sinyalidir.
const LAST_MODIFIED = new Date('2026-05-22')

export default function sitemap(): MetadataRoute.Sitemap {
  const emotionPages: MetadataRoute.Sitemap = EMOTION_SLUGS.map((slug) => ({
    url: `${siteUrl}/gezegen/${slug}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: `${siteUrl}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/hakkinda`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...emotionPages,
    {
      url: `${siteUrl}/gizlilik`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
