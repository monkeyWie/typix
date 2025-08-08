import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import type { ErrorReason } from "@/server/db/schemas/chat";
import { ProviderIcon } from "@lobehub/icons";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCw, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GenerationErrorItemProps {
	errorReason: ErrorReason;
	provider?: string;
	onRetry?: () => void;
	className?: string;
}

export function GenerationErrorItem({ errorReason, provider, onRetry, className }: GenerationErrorItemProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	// Determine error type and corresponding messages
	const getErrorInfo = (reason: ErrorReason) => {
		switch (reason) {
			case "CONFIG_INVALID":
			case "CONFIG_ERROR":
				return {
					title: t("chat.generation.configError"),
					description: t("chat.generation.configErrorDesc"),
					buttonText: t("chat.generation.goToSettings"),
					buttonIcon: Settings,
					buttonAction: "config" as const,
				};
			case "API_ERROR":
				return {
					title: t("chat.generation.apiError"),
					description: t("chat.generation.apiErrorDesc"),
					buttonText: t("chat.generation.retry"),
					buttonIcon: RefreshCw,
					buttonAction: "retry" as const,
				};
			case "TIMEOUT":
				return {
					title: t("chat.generation.timeoutError"),
					description: t("chat.generation.timeoutErrorDesc"),
					buttonText: t("chat.generation.retry"),
					buttonIcon: RefreshCw,
					buttonAction: "retry" as const,
				};
			default:
				return {
					title: t("chat.generation.unknownError"),
					description: t("chat.generation.unknownErrorDesc"),
					buttonText: t("chat.generation.retry"),
					buttonIcon: RefreshCw,
					buttonAction: "retry" as const,
				};
		}
	};

	const errorInfo = getErrorInfo(errorReason);

	const handleButtonClick = () => {
		if (errorInfo.buttonAction === "config") {
			// Navigate to provider settings
			if (provider) {
				navigate({
					to: "/settings/provider/$providerId",
					params: { providerId: provider },
				});
			} else {
				navigate({
					to: "/settings/provider",
				});
			}
		} else {
			// Retry action
			onRetry?.();
		}
	};

	const ButtonIcon = errorInfo.buttonIcon;

	return (
		<div className={cn("flex h-48 w-80 flex-col px-2 text-center", className)}>
			{/* Provider Icon Block */}
			{provider && (
				<div className="mb-6 flex flex-1 items-center justify-center">
					<ProviderIcon provider={provider} size={44} type="avatar" />
				</div>
			)}

			{/* Error Content Block */}
			<div className="mb-6 flex flex-1 flex-col items-center justify-center space-y-2 px-2">
				<h3 className="font-semibold text-foreground text-lg leading-tight">{errorInfo.title}</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">{errorInfo.description}</p>
			</div>

			{/* Action Button Block */}
			<div className="flex flex-1 items-center justify-center">
				<Button onClick={handleButtonClick} className="h-10 gap-2 px-6 font-medium text-sm">
					<ButtonIcon className="h-4 w-4" />
					{errorInfo.buttonText}
				</Button>
			</div>
		</div>
	);
}
