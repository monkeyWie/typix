import { useIsMobile } from "@/app/hooks/useMobile";
import type { ReactNode } from "react";

interface SettingsItemProps {
	title: string;
	description?: string;
	required?: boolean;
	status?: string;
	children: ReactNode;
	className?: string;
}

/**
 * Universal settings item component that adapts to desktop and mobile layouts
 * Desktop: left-right layout (title | content)
 * Mobile: top-bottom layout (title + description, then content)
 */
export function SettingsItem({ title, description, required, status, children, className = "" }: SettingsItemProps) {
	const isMobile = useIsMobile();

	// Render title with optional required indicator and status
	const renderTitle = () => {
		return (
			<div className="flex items-center gap-2">
				<span>{title}</span>
				{required && <span className="text-destructive">*</span>}
				{status && <span className="text-muted-foreground text-xs">{status}</span>}
			</div>
		);
	};

	return (
		<div className={`flex ${isMobile ? "flex-col gap-4" : "items-start justify-between"} ${className}`}>
			{/* Title and description section */}
			<div className={isMobile ? "" : "min-w-0 flex-shrink-0"}>
				<h3 className="font-medium text-lg">{renderTitle()}</h3>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</div>

			{/* Content section */}
			<div className={`${isMobile ? "" : "flex-shrink-0"}`}>{children}</div>
		</div>
	);
}
