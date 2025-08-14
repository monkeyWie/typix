import { Switch } from "@/app/components/ui/switch";
import { useAiService } from "@/app/hooks/useService";
import { ModelIcon } from "@lobehub/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ModelListSkeleton } from "./ModelListSkeleton";

interface ModelListProps {
	providerId: string;
}

export function ModelList({ providerId }: ModelListProps) {
	const aiService = useAiService();
	const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
	const { t, i18n } = useTranslation();

	// Get models for this provider
	const {
		data: models,
		isLoading,
		mutate,
	} = aiService.getAiModelsByProviderId.swr(`ai-models-${providerId}`, { providerId });

	// Handle model toggle
	const handleModelToggle = async (modelId: string, enabled: boolean) => {
		// Set pending state for this model
		setPendingUpdates((prev) => ({ ...prev, [modelId]: true }));

		try {
			await aiService.updateAiModel({
				providerId,
				modelId,
				enabled,
			});
			// Refresh model list
			mutate();
		} catch (error) {
			console.error("Failed to update model:", error);
		} finally {
			// Clear pending state
			setPendingUpdates((prev) => {
				const updated = { ...prev };
				delete updated[modelId];
				return updated;
			});
		}
	};

	if (isLoading) {
		return <ModelListSkeleton />;
	}

	return (
		<div className="space-y-4">
			<h3 className="font-medium text-lg">Models</h3>
			<div className="space-y-0">
				{models?.map((model) => (
					<div
						key={model.id}
						className="-mx-1 flex items-center justify-between gap-4 rounded px-1 py-3 transition-colors hover:bg-muted/50"
					>
						{/* Left side: Icon and model info */}
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<ModelIcon model={model.id} size={32} />
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium text-sm">{model.name}</div>
								{i18n.exists(`providers.${providerId}.models.${model.id}.description`) && (
									<div className="text-muted-foreground text-xs leading-relaxed">
										{t(`providers.${providerId}.models.${model.id}.description`)}
									</div>
								)}
							</div>
						</div>

						{/* Right side: Switch */}
						<Switch
							checked={model.enabled}
							disabled={pendingUpdates[model.id]}
							onCheckedChange={(enabled) => handleModelToggle(model.id, enabled)}
							className="flex-shrink-0"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
