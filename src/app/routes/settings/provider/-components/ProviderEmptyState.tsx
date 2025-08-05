import { LucideCpu, LucideSettings } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProviderEmptyStateProps {
	className?: string;
}

export function ProviderEmptyState({ className }: ProviderEmptyStateProps) {
	const { t } = useTranslation();

	return (
		<div className={`flex h-full w-full items-center justify-center ${className}`}>
			<div className="flex flex-col items-center justify-center text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<LucideCpu className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="mb-2 font-semibold text-lg">{t("settings.provider.selectProvider")}</h3>
				<p className="max-w-sm text-muted-foreground text-sm">{t("settings.provider.selectProviderDescription")}</p>
				<div className="mt-6 flex items-center gap-2 text-muted-foreground text-xs">
					<LucideSettings className="h-4 w-4" />
					<span>{t("settings.provider.configureToStart")}</span>
				</div>
			</div>
		</div>
	);
}
