import { locales } from "@/i18n";

// 静态导出配置
export const dynamic = "force-static";
export const revalidate = 3600; // 1小时重新验证

export async function GET() {
	const baseUrl = "https://typix.art";

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${locales
		.map((locale) => {
			const localeUrl = locale === "en" ? baseUrl : `${baseUrl}/${locale}`;
			const alternates = locales
				.map((l) => {
					const altUrl = l === "en" ? baseUrl : `${baseUrl}/${l}`;
					return `<xhtml:link rel="alternate" hreflang="${l}" href="${altUrl}" />`;
				})
				.join("\n    ");

			return `<url>
    <loc>${localeUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    ${alternates}
  </url>`;
		})
		.join("\n  ")}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
