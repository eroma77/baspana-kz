import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile', '/favorites', '/viewed', '/add', '/listing/*/edit', '/listing/*/promote'],
    },
    sitemap: 'https://baspana.kz/sitemap.xml',
  }
}
