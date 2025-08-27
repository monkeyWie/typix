// 静态导出配置
export const dynamic = "force-static";
export const revalidate = 86400; // 24小时重新验证

export async function GET() {
	const baseUrl = "https://typix.art";

	const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow specific paths
Disallow: /api/
Disallow: /_next/
Disallow: /admin/`;

	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain",
			"Cache-Control": "public, max-age=86400, s-maxage=86400",
		},
	});
}
