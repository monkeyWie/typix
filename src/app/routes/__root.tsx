import { DatabaseStudio } from "@/app/components/dev/DatabaseStudio";
import { LoginModal } from "@/app/components/login/LoginModal";
import { GlobalNavigation } from "@/app/components/navigation/GlobalNavigation";
import { Toaster } from "@/app/components/ui/sonner";
import { useAuth } from "@/app/hooks/useAuth";
import { useSettingsService } from "@/app/hooks/useService";
import { useThemeManager } from "@/app/hooks/useTheme";
import { initDb } from "@/app/lib/db-client";
import { initContext } from "@/server/service/context";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUIStore } from "../stores";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const { theme, themeColor, language, setTheme, setThemeColor, setLanguage, setIsMobile } = useUIStore();
	const { isLoading: authLoading } = useAuth();
	const [isInitialized, setIsInitialized] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);
	const [hasAuthResolved, setHasAuthResolved] = useState(false);
	const { i18n, t } = useTranslation();

	const settingsService = useSettingsService();

	// Apply theme and theme color with automatic system theme detection
	useThemeManager(theme, themeColor, setTheme);

	// Conditionally load Google Analytics when an ID is provided
	useEffect(() => {
		const gaId = import.meta.env.GOOGLE_ANALYTICS_ID as string | undefined;
		if (!gaId || gaId.trim() === "") return;

		if (!document.getElementById("ga-gtag")) {
			const script = document.createElement("script");
			script.id = "ga-gtag";
			script.async = true;
			script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
			document.head.appendChild(script);
		}

		if (!document.getElementById("ga-inline")) {
			const inline = document.createElement("script");
			inline.id = "ga-inline";
			inline.innerHTML = `
				window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());
				gtag('config', '${gaId}');
			`;
			document.head.appendChild(inline);
		}
	}, []);

	// Update loading title when initialization starts
	useEffect(() => {
		if (hasAuthResolved && !isInitialized && !initError && i18n.isInitialized) {
			const titleElement = document.getElementById("loading-title");
			if (titleElement) {
				titleElement.textContent = t("app.initializing");
				titleElement.style.display = "block";
			}
		}
	}, [hasAuthResolved, isInitialized, initError, t, i18n.isInitialized]);

	// Remove loading when app is fully loaded
	useEffect(() => {
		if (isInitialized && !initError) {
			const loadingElement = document.getElementById("loading");
			const loadingStyles = document.getElementById("loading-styles");
			if (loadingElement) {
				loadingElement.style.opacity = "0";
				setTimeout(() => {
					loadingElement.remove();
					if (loadingStyles) {
						loadingStyles.remove();
					}
				}, 300);
			}
		}
	}, [isInitialized, initError]);

	// Update loading title for error state
	useEffect(() => {
		if (initError && i18n.isInitialized) {
			const titleElement = document.getElementById("loading-title");
			if (titleElement) {
				titleElement.textContent = t("app.initializationFailed");
				titleElement.style.display = "block";
			}
		}
	}, [initError, i18n.isInitialized, t]);

	// Handle language change
	useEffect(() => {
		// Helper function to find compatible language
		const findCompatibleLanguage = (targetLang: string): string => {
			// Try exact match first
			if (i18n.hasResourceBundle(targetLang, "translation")) {
				return targetLang;
			}

			// Try underscore format (e.g., zh-HK -> zh_HK)
			const underscoreLang = targetLang.replace("-", "_");
			if (i18n.hasResourceBundle(underscoreLang, "translation")) {
				return underscoreLang;
			}

			// Try base language (e.g., zh-CN -> zh)
			const baseLang = targetLang.split("-")[0];
			if (baseLang && i18n.hasResourceBundle(baseLang, "translation")) {
				return baseLang;
			}

			// Default fallback
			return "en";
		};

		const updateLanguage = async () => {
			let targetLanguage: string;

			if (language && language !== "system") {
				// Use configured language
				targetLanguage = findCompatibleLanguage(language);
			} else if (language === "system") {
				// Use browser language detection
				const browserLang = navigator.language;
				targetLanguage = findCompatibleLanguage(browserLang);
			} else {
				return; // No language configuration
			}

			if (i18n.language !== targetLanguage) {
				await i18n.changeLanguage(targetLanguage);
			}
		};

		updateLanguage();
	}, [language, i18n]);

	async function initSettings() {
		try {
			const settings = await settingsService.getSettings();
			if (settings) {
				// Apply settings to UI store if they exist
				if (settings.theme) setTheme(settings.theme);
				if (settings.themeColor) setThemeColor(settings.themeColor);
				if (settings.language) setLanguage(settings.language);
			}
		} catch (error) {
			console.warn("Failed to load initial settings:", error);
		}
	}

	function initIsMobile() {
		// Initialize mobile detection first
		const MOBILE_BREAKPOINT = 768;
		const updateMobileState = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};

		// Set initial mobile state
		updateMobileState();

		// Listen for window resize
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const handleResize = () => updateMobileState();
		mql.addEventListener("change", updateMobileState);

		// Store cleanup function
		return () => {
			mql.removeEventListener("change", handleResize);
		};
	}

	// Track when auth has resolved at least once
	useEffect(() => {
		if (!authLoading && !hasAuthResolved) {
			setHasAuthResolved(true);
		}
	}, [authLoading, hasAuthResolved]);

	// Initialize database and load settings on app startup
	useEffect(() => {
		// Only initialize once auth has resolved for the first time
		if (!hasAuthResolved) {
			return;
		}

		let isMobileCleanup: (() => void) | null = null;

		const initialize = async () => {
			try {
				// Initialize database
				const db = await initDb();
				if (db) {
					initContext({
						db: db,
						providerCloudflareBuiltin: import.meta.env.PROVIDER_CLOUDFLARE_BUILTIN === "true",
					});
					await initSettings();
					isMobileCleanup = initIsMobile();
				}
			} catch (err) {
				console.error("Failed to initialize:", err);
				setInitError(err instanceof Error ? err.message : "Failed to initialize application");
			}

			setIsInitialized(true);
		};

		initialize();

		// Cleanup function
		return () => {
			if (isMobileCleanup) {
				isMobileCleanup();
			}
		};
	}, [hasAuthResolved]);

	// Show loading screen during initialization - let index.html handle display
	if (!isInitialized) {
		return null;
	}

	return <AppContent />;
}

function AppContent() {
	return (
		<div className="flex h-app bg-gradient-to-br from-background via-background to-muted/20 md:h-screen">
			<GlobalNavigation />
			<div className="relative flex flex-1 flex-col overflow-hidden md:ml-16">
				<Outlet />
			</div>
			<LoginModal />
			<Toaster position="top-center" />
			{process.env.NODE_ENV === "development" && <DatabaseStudio />}
		</div>
	);
}
