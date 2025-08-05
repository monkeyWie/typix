import { HomePage } from "@/components/home-page";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";

export default async function RootPage() {
	// 直接加载英文消息
	const messages = (await import("../../messages/en.json")).default;

	return (
		<NextIntlClientProvider messages={messages} locale="en">
			<ThemeProvider defaultTheme="system" storageKey="theme">
				<HomePage />
			</ThemeProvider>
		</NextIntlClientProvider>
	);
}
