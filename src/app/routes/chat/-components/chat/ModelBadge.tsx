import ProviderIcon from "@/app/components/icon/ProviderIcon";
import { ModelSelector } from "./ModelSelector";

interface ModelBadgeProps {
	currentProvider: string;
	currentModel: string;
	onModelChange: (provider: string, model: string) => void;
	isNewChat?: boolean;
}

export function ModelBadge({ currentProvider, currentModel, onModelChange, isNewChat = false }: ModelBadgeProps) {
	return (
		<div className="flex items-center gap-2">
			{currentProvider && <ProviderIcon provider={currentProvider} type="mono" className="h-6 w-6" />}
			<ModelSelector
				currentProvider={currentProvider}
				currentModel={currentModel}
				onModelChange={onModelChange}
				isNewChat={isNewChat}
			/>
		</div>
	);
}
