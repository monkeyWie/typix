"use client";

import { useLocale, useTranslations } from "next-intl";

export function SEOSchema() {
	const t = useTranslations("metadata");
	const locale = useLocale();

	const baseUrl = "https://typix.art";
	const title = "Typix AI";
	const description = t("description");

	const organizationSchema = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: title,
		url: baseUrl,
		logo: `${baseUrl}/logo.png`,
		description,
		sameAs: ["https://github.com/typix-ai", "https://twitter.com/TypixAI"],
	};

	const websiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: title,
		url: baseUrl,
		description,
		inLanguage: locale,
		publisher: {
			"@type": "Organization",
			name: title,
		},
	};

	const softwareSchema = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: title,
		description,
		url: baseUrl,
		applicationCategory: "AI Image Generation",
		operatingSystem: "Web Browser",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		creator: {
			"@type": "Organization",
			name: title,
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for structured data
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(organizationSchema),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for structured data
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(websiteSchema),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for structured data
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareSchema),
				}}
			/>
		</>
	);
}
