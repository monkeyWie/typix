import { DatabaseStudio } from "@/app/components/dev/DatabaseStudio";
import { LoginModal } from "@/app/components/login/LoginModal";
import { GlobalNavigation } from "@/app/components/navigation/GlobalNavigation";
import { Toaster } from "@/app/components/ui/sonner";
import { Spinner } from "@/app/components/ui/spinner";
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
	const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
	const { i18n, t } = useTranslation();

	// Settings service for loading initial theme configuration
	const settingsService = useSettingsService();

	// Apply theme and theme color with automatic system theme detection
	useThemeManager(theme, themeColor, setTheme);

	// Clean up loading div from index.html
	useEffect(() => {
		const loadingDiv = document.getElementById("loading");
		if (loadingDiv) {
			loadingDiv.remove();
		}
	}, []);

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

	// Initialize database and load settings on app startup
	useEffect(() => {
		// Wait for auth loading to complete before initializing, but only during initial auth check
		if (authLoading && isInitialAuthCheck) {
			return;
		}

		// Mark that initial auth check is complete once auth loading finishes for the first time
		if (!authLoading && isInitialAuthCheck) {
			setIsInitialAuthCheck(false);
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
	}, [authLoading, isInitialAuthCheck, setIsInitialAuthCheck]);

	// Show loading screen during initial auth loading or app initialization
	// After initial auth check, subsequent auth operations won't trigger global loading
	if ((authLoading && isInitialAuthCheck) || (!isInitialized && !initError)) {
		return (
			<div className="flex min-h-app items-center justify-center bg-background md:min-h-screen">
				<div className="space-y-4 text-center">
					<Spinner size="lg" className="mx-auto text-primary" />
					<h1 className="font-semibold text-2xl">{t("app.initializing")}</h1>
					<p className="text-muted-foreground">{t("app.initializingDescription")}</p>
				</div>
			</div>
		);
	}

	// Show error screen if initialization failed
	if (initError) {
		return (
			<div className="flex min-h-app items-center justify-center bg-background md:min-h-screen">
				<div className="space-y-4 text-center">
					<h1 className="font-semibold text-2xl text-destructive">{t("app.initializationFailed")}</h1>
					<p className="text-muted-foreground">{initError}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					>
						{t("app.retry")}
					</button>
				</div>
			</div>
		);
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
