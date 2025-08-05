import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/app/lib/utils";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SettingsSection {
	id: string;
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	path: string;
}

interface SettingsNavigationProps {
	sections: SettingsSection[];
	activeSection: string;
	onSectionChange: (sectionId: string) => void;
	className?: string;
	isMobile?: boolean;
}

export function SettingsNavigation({
	sections,
	activeSection,
	onSectionChange,
	className,
	isMobile = false,
}: SettingsNavigationProps) {
	const { t } = useTranslation();

	return (
		<div className={cn("flex h-full flex-col", className)}>
			{/* Navigation items - full height with scroll */}
			<ScrollArea className="flex-1">
				<div
					className={cn(
						"space-y-0.5", // Desktop: compact spacing
						isMobile && "space-y-2", // Mobile: larger spacing between items
					)}
				>
					{sections.map((section) => {
						const Icon = section.icon;
						const isActive = activeSection === section.id;

						return (
							<Button
								key={section.id}
								variant="ghost"
								className={cn(
									"relative h-auto w-full gap-3 border-0 text-left shadow-none",
									isMobile ? "justify-between p-4" : "justify-start p-2.5", // Mobile: larger padding
									// Desktop: show active state, Mobile: no active state styling
									!isMobile &&
										isActive && [
											"!bg-primary/15 !text-primary",
											"shadow-primary/20 shadow-sm",
											"hover:!bg-primary/15 hover:!text-primary hover:shadow-primary/20 hover:shadow-sm",
										],
									!isActive && "transition-all duration-75 hover:bg-secondary/60 hover:text-foreground",
								)}
								onClick={() => {
									// Force immediate state update and re-render
									onSectionChange(section.id);
								}}
								data-active={isActive}
							>
								{/* Left side: Icon and text */}
								<div
									className={cn(
										"flex items-center",
										isMobile ? "gap-4" : "gap-3", // Mobile: larger gap between icon and text
									)}
								>
									<Icon
										className={cn(
											"shrink-0 transition-colors duration-75",
											isMobile ? "h-5 w-5" : "h-4 w-4", // Mobile: larger icon
											!isMobile && isActive && "!text-primary",
										)}
									/>
									<div className="flex flex-col items-start gap-1">
										<span
											className={cn(
												"font-medium transition-colors duration-75",
												isMobile ? "text-base" : "text-sm", // Mobile: larger text
												!isMobile && isActive && "!font-semibold !text-primary",
											)}
										>
											{t(section.title)}
										</span>
									</div>
								</div>

								{/* Right side: Arrow icon (mobile only) */}
								{isMobile && (
									<ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-75" />
								)}
							</Button>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}
