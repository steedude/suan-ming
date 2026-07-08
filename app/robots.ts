import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/configs/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/history'],
    },
    sitemap: getSiteUrl('/sitemap.xml'),
  }
}
