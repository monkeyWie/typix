import { NavigationSidebar } from "@/app/components/navigation/NavigationSidebar";
import { useIsMobile } from "@/app/hooks/useMobile";
import {
	findSectionById,
	getDefaultSection,
	isValidSectionId,
	subscriptionSections,
} from "@/app/routes/subscription/-config";
import { Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/subscription")({
	component: SubscriptionLayoutComponent,
});

function SubscriptionLayoutComponent() {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const router = useRouter();
	const { t } = useTranslation();

	// Get current active section from the current route
	const currentPath = router.state.location.pathname;
	const getActiveSectionFromPath = (path: string): string => {
		// Extract the last segment of the path after /subscription/
		const pathSegments = path.split("/").filter(Boolean);
		const subscriptionIndex = pathSegments.indexOf("subscription");

		if (subscriptionIndex !== -1 && subscriptionIndex < pathSegments.length - 1) {
			const sectionId = pathSegments[subscriptionIndex + 1];
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
	}, [currentPath, subscriptionSections]);

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

	// Mobile: Show specific subscription page content (handled by child routes)
	if (isMobile) {
		return (
			<div className="min-h-screen overflow-y-auto">
				<Outlet />
			</div>
		);
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
							<h1 className="font-semibold text-2xl">{t("subscription.title")}</h1>
							<p className="text-muted-foreground text-sm">{t("subscription.description")}</p>
						</div>
					</div>
				</div>

				{/* Navigation Menu */}
				<div className="flex-1 p-4">
					<NavigationSidebar
						sections={subscriptionSections}
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
			<div className="min-w-0 flex-1 overflow-y-auto bg-muted/20">
				<Outlet />
			</div>
		</div>
	);
}
