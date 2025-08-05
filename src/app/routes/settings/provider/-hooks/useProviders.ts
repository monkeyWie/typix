import { useAiService } from "@/app/hooks/useService";
import { useAiProviderStore } from "@/app/stores";
import type { AiProvider } from "@/app/stores/useAiProviderStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Provider sections for navigation
export interface ProviderSection {
	id: string;
	name: string;
	description: string;
	path: string;
	provider: AiProvider;
}

// Custom hook to get providers and utility functions
export function useProviders() {
	const aiService = useAiService();
	const { providers, setProviders } = useAiProviderStore();
	const { t, i18n } = useTranslation();

	// Use SWR to fetch providers
	const { data: swrProviders, error, isLoading, mutate } = aiService.getAiProviders.swr("ai-providers");

	useEffect(() => {
		setProviders(swrProviders || []);
	}, [swrProviders]);

	// Generate provider sections from providers
	const providerSections: ProviderSection[] = (providers || []).map((provider) => ({
		id: provider.id,
		name: provider.name,
		description: i18n.exists(`providers.${provider.id}.description`)
			? t(`providers.${provider.id}.description`)
			: provider.name,
		path: `/settings/provider/${provider.id}`,
		provider,
	}));

	const findProviderById = (id: string): ProviderSection | undefined => {
		return providerSections.find((section) => section.id === id);
	};

	const getDefaultProvider = (): ProviderSection | undefined => {
		return providerSections[0];
	};

	const isValidProviderId = (id: string | undefined): boolean => {
		if (!id) return false;
		return providerSections.some((section) => section.id === id);
	};

	return {
		providers: providers || [],
		providerSections,
		isLoading,
		error,
		mutate,
		findProviderById,
		getDefaultProvider,
		isValidProviderId,
	};
}
