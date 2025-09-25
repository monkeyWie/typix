import { MobileNavigationIndexPage } from "@/app/components/navigation/MobileNavigationIndexPage";
import { findSectionById, getDefaultSection, subscriptionSections } from "@/app/routes/subscription/-config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/subscription/")({
	component: SubscriptionIndexPage,
});

function SubscriptionIndexPage() {
	return (
		<MobileNavigationIndexPage
			sections={subscriptionSections}
			findSectionById={findSectionById}
			getDefaultSection={getDefaultSection}
			titleKey="subscription.title"
			desktopRedirectPath="/subscription/plan"
		/>
	);
}
