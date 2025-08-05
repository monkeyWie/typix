"use client";

import { locales } from "@/i18n";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Helper function to get language name from messages
const getLanguageName = async (localeCode: string): Promise<string> => {
	try {
		const messages = await import(`../../messages/${localeCode}.json`);
		return messages.default.language?.name || localeCode;
	} catch {
		return localeCode;
	}
};

export function LanguageToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const localeFromHook = useLocale();
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [languageNames, setLanguageNames] = useState<Record<string, string>>({});

	// Get current locale from pathname since useLocale() doesn't work correctly with basePath in static export
	const getCurrentLocale = () => {
		const segments = pathname.split("/").filter(Boolean);
		if (segments.length > 0 && locales.includes(segments[0] as any)) {
			return segments[0];
		}
		return localeFromHook; // fallback to hook value
	};

	const currentLocale = getCurrentLocale();

	// Load language names from i18n messages
	useEffect(() => {
		const loadLanguageNames = async () => {
			const names: Record<string, string> = {};
			for (const localeCode of locales) {
				names[localeCode] = await getLanguageName(localeCode);
			}
			setLanguageNames(names);
		};

		loadLanguageNames();
		setMounted(true);
	}, []);

	const toggleLanguage = (newLocale: string) => {
		if (!mounted) return;

		// pathname from usePathname() excludes basePath in Next.js
		// e.g., if full URL is /home/en/page, pathname will be /en/page
		const segments = pathname.split("/").filter(Boolean);

		// Check if first segment is a locale
		if (segments.length > 0 && locales.includes(segments[0] as any)) {
			// Replace existing locale
			segments[0] = newLocale;
		} else {
			// Prepend locale if no locale found
			segments.unshift(newLocale);
		}

		const newPath = `/${segments.join("/")}`;
		router.push(newPath);
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => mounted && setIsOpen(!isOpen)}
				className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/20 backdrop-blur-sm transition-all duration-300 hover:border-border/40 hover:bg-accent/10 hover:backdrop-blur-md disabled:cursor-default"
				aria-label="Toggle language"
				disabled={!mounted}
			>
				<Languages className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-foreground" />
			</button>

			{mounted && isOpen && (
				<>
					<div
						className="fixed inset-0 z-10"
						onClick={() => setIsOpen(false)}
						onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
						tabIndex={0}
						role="button"
						aria-label="Close language menu"
					/>
					<div className="absolute top-full right-0 z-20 mt-2 w-32 overflow-hidden rounded-xl border border-border/30 bg-background/95 shadow-2xl backdrop-blur-md">
						{locales.map((localeCode, index) => {
							const isSelected = currentLocale === localeCode;

							return (
								<div key={localeCode}>
									<button
										type="button"
										onClick={() => toggleLanguage(localeCode)}
										className={`w-full cursor-pointer px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
											isSelected
												? "border-slate-400 border-l-2 bg-slate-100 font-semibold text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
												: "text-muted-foreground"
										}`}
									>
										{languageNames[localeCode] || localeCode}
									</button>
									{index < locales.length - 1 && <div className="h-px w-full bg-border/30" />}
								</div>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
