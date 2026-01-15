import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all planets for dynamic routes
  const supabase = await createClient()
  const { data: planets } = await supabase
    .from('planets')
    .select('id, updated_at')
    .order('display_order', { ascending: true })

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/evren`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/giris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/kayit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/gizlilik`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic planet pages
  const planetPages: MetadataRoute.Sitemap = (planets || []).map((planet) => ({
    url: `${siteUrl}/gezegen/${planet.id}`,
    lastModified: planet.updated_at ? new Date(planet.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...planetPages]
}
