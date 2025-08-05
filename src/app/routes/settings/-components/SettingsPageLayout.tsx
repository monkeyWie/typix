import { useIsMobile } from "@/app/hooks/useMobile";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { findSectionById, getDefaultSection } from "../-config";
import { SettingsContent } from "./SettingsContent";

interface SettingsPageLayoutProps {
	// Content
	children: React.ReactNode;

	// Loading state
	isLoading?: boolean;
	loadingFallback?: React.ReactNode;

	// Layout control
	maxWidthFit?: boolean;
}

/**
 * Common layout component for settings pages
 * Handles mobile/desktop responsive layout automatically
 * Automatically gets title from route configuration
 */
export function SettingsPageLayout({ children, isLoading = false, loadingFallback }: SettingsPageLayoutProps) {
	const isMobile = useIsMobile();
	const router = useRouter();
	const { t } = useTranslation();

	// Default loading fallback
	const defaultLoadingFallback = <div>{t("common.loading")}</div>;
	const actualLoadingFallback = loadingFallback || defaultLoadingFallback;

	// Get current path and extract section ID
	const currentPath = router.state.location.pathname;
	const sectionId = currentPath.split("/").pop() || getDefaultSection().id; // Default to 'common' if no section

	// Get section config from route path
	const section = findSectionById(sectionId);
	const titleKey = section?.title || getDefaultSection().title; // Fallback title key
	const title = t(titleKey); // Translate the i18n key

	// Determine content to show
	const content = isLoading ? actualLoadingFallback : children;

	return (
		<SettingsContent title={title} isMobile={isMobile}>
			{content}
		</SettingsContent>
	);
}
