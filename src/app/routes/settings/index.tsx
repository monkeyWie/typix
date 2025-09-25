import { MobileNavigationIndexPage } from "@/app/components/navigation/MobileNavigationIndexPage";
import { findSectionById, getDefaultSection, settingsSections } from "@/app/routes/settings/-config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
	component: SettingsIndexPage,
});

function SettingsIndexPage() {
	return (
		<MobileNavigationIndexPage
			sections={settingsSections}
			findSectionById={findSectionById}
			getDefaultSection={getDefaultSection}
			titleKey="settings.title"
			desktopRedirectPath="/settings/common"
		/>
	);
}
