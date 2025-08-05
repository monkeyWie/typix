import { useIsMobile } from "@/app/hooks/useMobile";
import { SettingsPageLayout } from "@/app/routes/settings/-components/SettingsPageLayout";
import { ProviderEmptyState } from "@/app/routes/settings/provider/-components/ProviderEmptyState";
import { ProviderListSkeleton } from "@/app/routes/settings/provider/-components/ProviderListSkeleton";
import { ProviderNavigation } from "@/app/routes/settings/provider/-components/ProviderNavigation";
import { useProviders } from "@/app/routes/settings/provider/-hooks/useProviders";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/settings/provider/")({
	component: ProviderIndexPage,
});

function ProviderIndexPage() {
	const isMobile = useIsMobile();
	const navigate = useNavigate();

	// Get providers from service
	const { providerSections, isLoading, findProviderById } = useProviders();

	const [activeProvider, setActiveProvider] = useState<string | undefined>(undefined);

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

	// Content for mobile: provider list
	const mobileContent = (
		<div className="flex-1">
			<ProviderNavigation
				providers={providerSections}
				activeProvider={activeProvider}
				onProviderChange={navigateToProvider}
				className="h-full"
				isMobile={true}
			/>
		</div>
	);

	// Content for desktop: empty state (no provider selected)
	const desktopContent = <ProviderEmptyState />;

	return (
		<SettingsPageLayout isLoading={isLoading} loadingFallback={<ProviderListSkeleton />}>
			{isMobile ? mobileContent : desktopContent}
		</SettingsPageLayout>
	);
}
