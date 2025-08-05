import { useIsMobile } from "@/app/hooks/useMobile";
import { SettingsNavigation } from "@/app/routes/settings/-components/SettingsNavigation";
import { findSectionById, getDefaultSection, isValidSectionId, settingsSections } from "@/app/routes/settings/-config";
import { Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { LucideSettings } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings")({
	component: SettingsLayoutComponent,
});

function SettingsLayoutComponent() {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const router = useRouter();
	const { t } = useTranslation();

	// Get current active section from the current route
	const currentPath = router.state.location.pathname;
	const getActiveSectionFromPath = (path: string): string => {
		// Extract the last segment of the path after /settings/
		const pathSegments = path.split("/").filter(Boolean);
		const settingsIndex = pathSegments.indexOf("settings");

		if (settingsIndex !== -1 && settingsIndex < pathSegments.length - 1) {
			const sectionId = pathSegments[settingsIndex + 1];
			// Validate that the section exists in our defined sections
			return sectionId && isValidSectionId(sectionId) ? sectionId : getDefaultSection().id;
		}

		return getDefaultSection().id;
	};

	const [activeSection, setActiveSection] = useState(getActiveSectionFromPath(currentPath));

	// Update active section when route changes
	useEffect(() => {
		const newActiveSection = getActiveSectionFromPath(currentPath);
		setActiveSection(newActiveSection);
	}, [currentPath, settingsSections]);

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

	// Mobile: Show specific settings page content (handled by child routes)
	if (isMobile) {
		return <Outlet />;
	}

	// Desktop: Side-by-side layout with navigation + content
	return (
		<div className="flex h-full">
			{/* Desktop Navigation Sidebar */}
			<div className="flex w-72 shrink-0 flex-col bg-background/95 backdrop-blur-lg">
				{/* Sidebar Header */}
				<div className="p-6">
					<div className="flex items-center gap-3">
						<div>
							<h1 className="font-semibold text-2xl">{t("settings.title")}</h1>
							<p className="text-muted-foreground text-sm">{t("settings.description")}</p>
						</div>
					</div>
				</div>

				{/* Navigation Menu */}
				<div className="flex-1 p-4">
					<SettingsNavigation
						sections={settingsSections}
						activeSection={activeSection}
						onSectionChange={navigateToSection}
						className="h-full"
						isMobile={false}
					/>
				</div>
			</div>

			{/* Vertical separator line */}
			<div className="w-[0.5px] bg-border/60" />

			{/* Desktop Content Area */}
			<div className="min-w-0 flex-1 bg-muted/20">
				<Outlet />
			</div>
		</div>
	);
}
