import ProviderIcon from "@/app/components/icon/ProviderIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useAiService } from "@/app/hooks/useService";

interface ModelSelectorProps {
	currentProvider: string;
	currentModel: string;
	onModelChange: (provider: string, model: string) => void;
	// Flag to indicate if this is for a new chat (should auto-select) or existing chat (should not auto-select)
	isNewChat?: boolean;
}

export function ModelSelector({ currentProvider, currentModel, onModelChange, isNewChat = false }: ModelSelectorProps) {
	const aiService = useAiService();

	// Fetch AI providers and models
	const { data: providers, isLoading } = aiService.getEnabledAiProvidersWithModels.swr("ai-providers-with-models");

	// No auto-selection logic here - it's handled in the parent component

	// Find current provider and model info for display
	const provider = providers?.find((p) => p.id === currentProvider);
	const model = provider?.models.find((m) => m.id === currentModel);
	const displayName = model?.name || currentModel;

	// Create a combined value for the select (provider:model)
	const currentValue = `${currentProvider}:${currentModel}`;

	const handleValueChange = (value: string) => {
		const [provider, model] = value.split(":");
		if (provider && model) {
			onModelChange(provider, model);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-20" />
			</div>
		);
	}

	// If no provider or model is selected, show loading state
	if (!currentProvider || !currentModel) {
		return (
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-20" />
			</div>
		);
	}

	return (
		<Select value={currentValue} onValueChange={handleValueChange}>
			<SelectTrigger className="h-7 w-auto gap-2 border-primary/20 bg-primary/10 px-3 text-primary hover:bg-primary/20">
				<SelectValue placeholder={displayName} />
			</SelectTrigger>
			<SelectContent className="max-h-72 [&>*[data-slot=select-scroll-down-button]]:hidden [&>*[data-slot=select-scroll-up-button]]:hidden">
				<div className="max-h-72 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
					{providers?.map((provider) => {
						if (!provider.enabled) return null;

						return (
							<div key={provider.id}>
								{/* Provider group header */}
								<div className="flex items-center gap-2 px-2 py-1.5 font-medium text-muted-foreground text-sm">
									<ProviderIcon provider={provider.id} type="mono" className="h-4 w-4" />
									{provider.name}
								</div>

								{/* Models for this provider */}
								{provider.models.map((model) => (
									<SelectItem key={`${provider.id}:${model.id}`} value={`${provider.id}:${model.id}`} className="pl-8">
										{model.name}
									</SelectItem>
								))}
							</div>
						);
					})}
				</div>
			</SelectContent>
		</Select>
	);
}
