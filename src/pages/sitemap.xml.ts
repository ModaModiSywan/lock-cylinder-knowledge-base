import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

// 6 大核心锁芯分类
const CORE_CATEGORIES = [
  'types-functions',
  'materials-finishes',
  'keying-systems',
  'security-mechanisms',
  'standards-testing',
  'sizing-installation'
];

// XML 特殊字符转义辅助函数
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export const GET: APIRoute = async ({ site, url }) => {
  const baseUrl = (site ? site.toString() : url.origin).replace(/\/$/, '');
  const now = new Date().toISOString();

  // 1. 核心静态路由与 6 大固定分类页
  const staticRoutes = [
    { url: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
    { url: `${baseUrl}/search`, priority: '0.5', changefreq: 'weekly', lastmod: now },
    ...CORE_CATEGORIES.map((cat) => ({
      url: `${baseUrl}/${cat}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: now,
    }))
  ];

  // 2. 从 Supabase 表 lock_cylinder_entries 获取所有文章详情页数据
  let dynamicArticleUrls: { url: string; priority: string; changefreq: string; lastmod: string }[] = [];

  try {
    const { data: entries, error } = await supabase
      .from('lock_cylinder_entries')
      .select('slug, category_slug, updated_at, created_at')
      .order('updated_at', { ascending: false });

    if (!error && entries && entries.length > 0) {
      // 生成文章详情页 URL
      entries.forEach((item) => {
        if (item.category_slug && item.slug) {
          const lastmodDate = item.updated_at || item.created_at || now;
          dynamicArticleUrls.push({
            url: `${baseUrl}/${item.category_slug}/${item.slug}`,
            priority: '0.7',
            changefreq: 'monthly',
            lastmod: new Date(lastmodDate).toISOString(),
          });
        }
      });
    }
  } catch (err) {
    console.error('Error generating sitemap from Supabase lock_cylinder_entries:', err);
  }

  const allRoutes = [...staticRoutes, ...dynamicArticleUrls];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(route.url)}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xmlContent.trim() + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
    },
  });
};