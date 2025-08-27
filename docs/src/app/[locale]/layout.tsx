import { SEOSchema } from "@/components/seo-schema";
import { ThemeProvider } from "@/components/theme-provider";
import { locales } from "@/i18n";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const metadata = await getTranslations({ locale, namespace: "metadata" });
	const nav = await getTranslations({ locale, namespace: "nav" });

	const title = `Typix - ${nav("slogan")}`;
	const description = metadata("description");
	const keywords = metadata("keywords");
	const siteUrl = "https://typix.art";

	return {
		title,
		description,
		keywords,
		authors: [{ name: "Typix AI" }],
		creator: "Typix AI",
		publisher: "Typix AI",
		formatDetection: {
			email: false,
			address: false,
			telephone: false,
		},
		metadataBase: new URL(siteUrl),
		alternates: {
			canonical: "/",
			languages: {
				"en-US": "/en",
				"zh-CN": "/zh",
			},
		},
		openGraph: {
			type: "website",
			locale,
			title,
			description,
			siteName: "Typix AI",
			url: siteUrl,
			images: [
				{
					url: "/og-image.jpg",
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			creator: "@TypixAI",
			images: ["/og-image.jpg"],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
		verification: {
			google: "your-google-verification-code",
		},
		other: {
			"msapplication-TileColor": "#000000",
			"theme-color": "#000000",
			"apple-mobile-web-app-capable": "yes",
			"apple-mobile-web-app-status-bar-style": "default",
			"apple-mobile-web-app-title": title,
		},
		manifest: "/manifest.json",
	};
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	if (!locales.includes(locale as any)) {
		notFound();
	}

	const messages = await getMessages({ locale });

	return (
		<NextIntlClientProvider messages={messages}>
			<ThemeProvider defaultTheme="system" storageKey="theme">
				<SEOSchema />
				{children}
			</ThemeProvider>
		</NextIntlClientProvider>
	);
}
