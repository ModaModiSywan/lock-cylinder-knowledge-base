import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ site, url }) => {
  const baseUrl = (site ? site.toString() : url.origin).replace(/\/$/, '');

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /search?*

# Host & Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl.replace(/^https?:\/\//, '')}
`;

  return new Response(robotsTxt.trim() + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
};