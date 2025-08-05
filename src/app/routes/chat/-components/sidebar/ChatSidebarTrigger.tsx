import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { useSidebar } from "@/app/routes/chat/-hooks/useChatSidebar";
import { Menu, PanelLeft, PanelLeftClose, PanelRightClose } from "lucide-react";

interface ChatSidebarTriggerProps {
	/** Whether to force hide the trigger (useful for specific layouts) */
	forceHide?: boolean;
	/** Show text label alongside icon (default: false for mobile, true for desktop) */
	showLabel?: boolean;
	/** Custom variant for the button */
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	/** Custom size for the button */
	size?: "default" | "sm" | "lg" | "icon";
	/** Additional className for custom styling */
	className?: string;
	/** Whether to show desktop-specific icons (PanelLeft/PanelLeftClose) */
	useDesktopIcons?: boolean;
	/** Whether to always show the trigger, even when sidebar is open on desktop */
	alwaysShow?: boolean;
}

export function ChatSidebarTrigger({
	forceHide = false,
	size = "icon",
	className,
	useDesktopIcons = false,
}: ChatSidebarTriggerProps) {
	const { toggle, isOpen, isMobile } = useSidebar();
	if (forceHide) return null;

	// Desktop: Always show trigger button
	// Mobile: Always show trigger button
	// Remove the conditional hiding logic for simpler behavior

	// Default behavior for showLabel based on device type
	const getIcon = () => {
		if (isMobile) {
			// Mobile: Use Menu icon for open, X icon for close (handled by Sheet component)
			return <Menu className="size-5" />;
		}

		// Desktop: Use Panel icons with consistent size
		if (useDesktopIcons) {
			return isOpen ? <PanelLeftClose className="size-5" /> : <PanelRightClose className="size-5" />;
		}
		return <PanelLeft className="size-5" />;
	};

	return (
		<Button
			variant="ghost"
			size={size}
			onClick={toggle}
			className={cn(
				"flex-shrink-0 transition-all duration-200",
				isMobile && ["h-9 w-9", "hover:bg-accent/80", "ml-0"],
				!isMobile && ["h-8 w-8", "hover:scale-105 hover:bg-accent/60", !isOpen && "shadow-md hover:shadow-lg"],
				className,
			)}
		>
			{getIcon()}
		</Button>
	);
}
