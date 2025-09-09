import { Slider } from "@/app/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";
import { getModelById } from "@/server/ai/provider";
import type { AspectRatio } from "@/server/ai/types/api";
import { RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface ImagePreferencesProps {
	imageCount: number;
	aspectRatio?: AspectRatio;
	onImageCountChange: (count: number) => void;
	onAspectRatioChange: (ratio: AspectRatio | undefined) => void;
	currentProvider?: string;
	currentModel?: string;
	onClose: () => void;
}

// Aspect ratio icon mapping
const AspectRatioIcons = {
	"1:1": Square,
	"16:9": RectangleHorizontal,
	"9:16": RectangleVertical,
	"4:3": RectangleHorizontal,
	"3:4": RectangleVertical,
};

export function ImagePreferences({
	imageCount,
	aspectRatio,
	onImageCountChange,
	onAspectRatioChange,
	currentProvider,
	currentModel,
	onClose,
}: ImagePreferencesProps) {
	const { t } = useTranslation();
	const panelRef = useRef<HTMLDivElement>(null);

	// Get supported aspect ratios from current model
	const supportedAspectRatios = (() => {
		if (!currentProvider || !currentModel) return [];

		try {
			const model = getModelById(currentProvider, currentModel);
			return model.supportedAspectRatios || [];
		} catch {
			return [];
		}
	})();

	// Handle click outside to close panel
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	return (
		<div
			ref={panelRef}
			className="w-64 rounded-lg border border-border/50 bg-background/95 p-3 shadow-lg backdrop-blur-md"
		>
			<div className="space-y-4">
				{/* Image Count Slider */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">{t("chat.imageCount")}</span>
						<span className="rounded bg-muted px-2 py-1 font-mono text-xs">{imageCount}</span>
					</div>
					<Slider
						value={[imageCount]}
						onValueChange={(value: number[]) => onImageCountChange(value[0] || 1)}
						max={4}
						min={1}
						step={1}
						className="w-full"
					/>
					<div className="flex justify-between text-muted-foreground text-xs">
						<span>1</span>
						<span>4</span>
					</div>
				</div>

				{/* Aspect Ratio Selection */}
				{supportedAspectRatios.length > 0 && (
					<div className="space-y-2">
						<span className="text-muted-foreground text-sm">{t("chat.aspectRatio")}</span>
						<div className="grid grid-cols-3 gap-2">
							{/* Auto/None option */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => onAspectRatioChange(undefined)}
											className={cn(
												"h-8 w-full rounded-md border-0 text-xs outline-none transition-all duration-200 focus:outline-none",
												aspectRatio === undefined
													? "scale-105 bg-primary text-primary-foreground shadow-md shadow-primary/25"
													: "bg-muted/50 text-muted-foreground hover:scale-105 hover:bg-muted hover:text-foreground",
											)}
										>
											{t("chat.auto")}
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("chat.autoAspectRatio")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							{/* Supported aspect ratios */}
							{supportedAspectRatios.map((ratio) => {
								const IconComponent = AspectRatioIcons[ratio];
								const isSelected = aspectRatio === ratio;
								return (
									<TooltipProvider key={ratio}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={() => onAspectRatioChange(ratio)}
													className={cn(
														"flex h-8 w-full items-center justify-center rounded-md border-0 outline-none transition-all duration-200 focus:outline-none",
														isSelected
															? "scale-105 bg-primary text-primary-foreground shadow-md shadow-primary/25"
															: "bg-muted/50 text-muted-foreground hover:scale-105 hover:bg-muted hover:text-foreground",
													)}
												>
													<IconComponent
														className={cn("h-3.5 w-3.5 transition-all duration-200", isSelected && "drop-shadow-sm")}
													/>
												</button>
											</TooltipTrigger>
											<TooltipContent>
												<p>{ratio}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
