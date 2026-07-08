import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/configs/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: getSiteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
