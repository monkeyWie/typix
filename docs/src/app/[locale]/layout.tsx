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

	return {
		title: `Typix - ${nav("slogan")}`,
		description: metadata("description"),
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
				{children}
			</ThemeProvider>
		</NextIntlClientProvider>
	);
}
