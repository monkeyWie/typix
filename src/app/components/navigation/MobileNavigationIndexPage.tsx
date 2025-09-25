import { MobileTopBar } from "@/app/components/navigation/MobileTopBar";
import { NavigationSidebar } from "@/app/components/navigation/NavigationSidebar";
import type { NavigationSection } from "@/app/components/navigation/NavigationSidebar";
import { useIsMobile } from "@/app/hooks/useMobile";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MobileNavigationIndexPageProps<T extends NavigationSection> {
	/** Navigation sections configuration array */
	sections: T[];
	/** Function to find section by ID */
	findSectionById: (sectionId: string) => T | undefined;
	/** Function to get the default section */
	getDefaultSection: () => T;
	/** Internationalization key for page title */
	titleKey: string;
	/** Desktop redirect path */
	desktopRedirectPath: string;
}

/**
 * Generic mobile navigation index page component
 * Extracted common logic from settings and subscription pages
 */
export function MobileNavigationIndexPage<T extends NavigationSection>({
	sections,
	findSectionById,
	getDefaultSection,
	titleKey,
	desktopRedirectPath,
}: MobileNavigationIndexPageProps<T>) {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [activeSection, setActiveSection] = useState(getDefaultSection().id);

	// Navigate to a section
	const navigateToSection = (sectionId: string) => {
		const section = findSectionById(sectionId);
		if (section?.path) {
			navigate({
				to: section.path,
				replace: false,
				resetScroll: true,
			});
		}
		setActiveSection(sectionId);
	};

	// Wait for mobile detection to complete
	if (isMobile === undefined) {
		return null;
	}

	// On mobile, show the navigation menu
	if (isMobile) {
		return (
			<div className="flex h-full flex-col">
				<MobileTopBar title={t(titleKey)} />
				<div className="flex-1 p-4">
					<NavigationSidebar
						sections={sections}
						activeSection={activeSection}
						onSectionChange={navigateToSection}
						className="flex-1"
						isMobile={true}
					/>
				</div>
			</div>
		);
	}

	// On desktop, redirect to the default section
	return <Navigate to={desktopRedirectPath} replace />;
}
