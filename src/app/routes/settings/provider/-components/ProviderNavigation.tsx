import ProviderIcon from "@/app/components/icon/ProviderIcon";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/app/lib/utils";
import type { ProviderSection } from "@/app/routes/settings/provider/-hooks/useProviders";
import { useTranslation } from "react-i18next";

interface ProviderNavigationProps {
	providers: ProviderSection[];
	activeProvider?: string;
	onProviderChange: (providerId: string) => void;
	className?: string;
	isMobile?: boolean;
}

export function ProviderNavigation({
	providers,
	activeProvider,
	onProviderChange,
	className,
	isMobile = false,
}: ProviderNavigationProps) {
	const { t } = useTranslation();

	// Separate providers into enabled and disabled
	const enabledProviders = providers.filter((provider) => provider.provider.enabled !== false);
	const disabledProviders = providers.filter((provider) => provider.provider.enabled === false);

	const renderProviderButton = (provider: ProviderSection, isEnabled: boolean) => (
		<Button
			key={provider.id}
			variant={activeProvider === provider.id ? "secondary" : "ghost"}
			className={cn(
				"h-auto w-full justify-start p-3 text-left",
				activeProvider === provider.id && "bg-accent/50 text-accent-foreground",
				!isEnabled && "opacity-60",
			)}
			onClick={() => onProviderChange(provider.id)}
		>
			<div className="flex items-center space-x-3">
				<ProviderIcon
					className={cn("h-4 w-4", isEnabled ? "text-primary" : "text-muted-foreground")}
					provider={provider.id}
					type={isEnabled ? "color" : "mono"}
				/>
				<div className="font-medium">{provider.name}</div>
			</div>
		</Button>
	);

	// Render provider sections - common logic for both mobile and desktop
	const renderProviderSections = () => (
		<>
			{/* Enabled Providers */}
			{enabledProviders.length > 0 && (
				<div>
					<h3 className="mb-3 font-medium text-muted-foreground text-sm">{t("settings.provider.enabled")}</h3>
					<div className="space-y-2">{enabledProviders.map((provider) => renderProviderButton(provider, true))}</div>
				</div>
			)}

			{/* Disabled Providers */}
			{disabledProviders.length > 0 && (
				<div>
					<h3 className="mb-3 font-medium text-muted-foreground text-sm">{t("settings.provider.disabled")}</h3>
					<div className="space-y-2">{disabledProviders.map((provider) => renderProviderButton(provider, false))}</div>
				</div>
			)}
		</>
	);

	if (isMobile) {
		return <div className={cn("space-y-6", className)}>{renderProviderSections()}</div>;
	}

	// Desktop navigation
	return (
		<ScrollArea className={cn("h-full", className)}>
			<div className="space-y-6 p-2">{renderProviderSections()}</div>
		</ScrollArea>
	);
}
