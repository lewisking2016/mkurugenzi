import type { MetadataRoute } from 'next';

/**
 * Keeps search engines and crawlers out of the staff area.
 *
 * The admin screens also send `noindex` in their metadata; this is the second
 * layer, and it also covers the API routes (which have no metadata at all).
 * Note this is crawler politeness, NOT access control — the session cookie and
 * password are what actually protect these routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/mkuruadmin', '/mkuruadmin/', '/api/admin', '/api/admin/', '/uploads'],
      },
    ],
  };
}
