import { MobileTopBar } from "@/app/components/navigation/MobileTopBar";
import { useIsMobile } from "@/app/hooks/useMobile";
import { SettingsNavigation } from "@/app/routes/settings/-components/SettingsNavigation";
import { findSectionById, getDefaultSection, settingsSections } from "@/app/routes/settings/-config";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings/")({
	component: SettingsIndexPage,
});

function SettingsIndexPage() {
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

	// On mobile, show the settings menu
	if (isMobile) {
		return (
			<div className="flex h-full flex-col">
				<MobileTopBar title={t("settings.title")} />
				<div className="flex-1 p-4">
					<SettingsNavigation
						sections={settingsSections}
						activeSection={activeSection}
						onSectionChange={navigateToSection}
						className="flex-1"
						isMobile={true}
					/>
				</div>
			</div>
		);
	}

	// On desktop, redirect to the first settings section
	return <Navigate to="/settings/common" replace />;
}
