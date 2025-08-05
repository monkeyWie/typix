import { useIsMobile } from "@/app/hooks/useMobile";
import { findSectionById } from "@/app/routes/settings/-config";
import { ProviderListSkeleton } from "@/app/routes/settings/provider/-components/ProviderListSkeleton";
import { ProviderNavigation } from "@/app/routes/settings/provider/-components/ProviderNavigation";
import { useProviders } from "@/app/routes/settings/provider/-hooks/useProviders";
import { Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings/provider")({
	component: ProviderLayoutComponent,
});

function ProviderLayoutComponent() {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const router = useRouter();
	const { t } = useTranslation();

	// Get providers from service
	const { providerSections, isLoading, findProviderById, getDefaultProvider, isValidProviderId } = useProviders();

	// Get provider section config for title
	const providerSection = findSectionById("provider");
	const providerTitle = providerSection ? t(providerSection.title) : t("settings.provider.title");

	// Get current active provider from the current route
	const currentPath = router.state.location.pathname;
	const getActiveProviderFromPath = (path: string): string | undefined => {
		// Extract the provider ID from path like /settings/provider/openai
		const pathSegments = path.split("/").filter(Boolean);
		const providerIndex = pathSegments.indexOf("provider");

		if (providerIndex !== -1 && providerIndex < pathSegments.length - 1) {
			const providerId = pathSegments[providerIndex + 1];
			// Validate that the provider exists
			if (providerId && isValidProviderId(providerId)) {
				return providerId;
			}
		}

		return getDefaultProvider()?.id;
	};

	const [activeProvider, setActiveProvider] = useState<string | undefined>(
		currentPath.includes("/settings/provider/") ? getActiveProviderFromPath(currentPath) : undefined,
	);

	// Update active provider when route changes
	useEffect(() => {
		if (currentPath.includes("/settings/provider/")) {
			const newActiveProvider = getActiveProviderFromPath(currentPath);
			setActiveProvider(newActiveProvider);
		} else {
			setActiveProvider(undefined);
		}
	}, [currentPath, providerSections]);

	// Navigate to a provider
	const navigateToProvider = (providerId: string) => {
		const provider = findProviderById(providerId);
		if (provider?.path) {
			navigate({
				to: provider.path,
				replace: false,
				resetScroll: true,
			});
		}
		setActiveProvider(providerId);
	};

	// Mobile: Show specific provider page content (handled by child routes)
	if (isMobile) {
		return <Outlet />;
	}

	// Desktop: Side-by-side layout with navigation + content
	return (
		<div className="flex h-full">
			{/* Desktop Provider Navigation Sidebar */}
			<div className="flex w-72 shrink-0 flex-col bg-background/95 backdrop-blur-lg">
				{/* Sidebar Header */}
				<div className="p-6">
					<div className="flex items-center gap-3">
						<div>
							<h1 className="font-semibold text-2xl">{providerTitle}</h1>
							<p className="text-muted-foreground text-sm">{t("settings.provider.description")}</p>
						</div>
					</div>
				</div>

				{/* Provider Navigation Menu */}
				{isLoading ? (
					<ProviderListSkeleton />
				) : (
					<div className="flex-1 p-4">
						<ProviderNavigation
							providers={providerSections}
							activeProvider={activeProvider}
							onProviderChange={navigateToProvider}
							className="h-full"
							isMobile={false}
						/>
					</div>
				)}
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
