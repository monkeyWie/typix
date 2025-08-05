import { useIsMobile } from "@/app/hooks/useMobile";
import { useAiService } from "@/app/hooks/useService";
import { SettingsContent } from "@/app/routes/settings/-components/SettingsContent";
import { ModelList } from "@/app/routes/settings/provider/-components/ModelList";
import { ProviderDetailSkeleton } from "@/app/routes/settings/provider/-components/ProviderDetailSkeleton";
import {
	ProviderSettingsForm,
	type UpdateProviderParams,
} from "@/app/routes/settings/provider/-components/ProviderSettingsForm";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProviders } from "./-hooks/useProviders";

export const Route = createFileRoute("/settings/provider/$providerId")({
	component: ProviderDetailPage,
});

function ProviderDetailPage() {
	const { providerId } = Route.useParams();
	const isMobile = useIsMobile();
	const aiService = useAiService();
	const { mutate } = useProviders();

	// Get specific provider from service
	const { data: provider, isLoading } = aiService.getAiProviderById.swr(`ai-provider-${providerId}`, { providerId });

	// Show loading state
	if (isLoading) {
		return <ProviderDetailSkeleton />;
	}

	// Find the provider configuration
	if (!provider) {
		throw notFound();
	}

	// Save function using the service
	const handleSave = async (params: UpdateProviderParams) => {
		try {
			await aiService.updateAiProvider(params);
			mutate();
		} catch (error) {
			console.error("Failed to save provider settings:", error);
			throw error;
		}
	};

	return (
		<SettingsContent title={provider.name} isMobile={isMobile}>
			<div className="space-y-16">
				<ProviderSettingsForm provider={provider} onSave={handleSave} />
				<ModelList providerId={providerId} />
			</div>
		</SettingsContent>
	);
}
