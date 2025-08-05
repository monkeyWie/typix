import { MobileTopBar } from "@/app/components/navigation/MobileTopBar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import type { ReactNode } from "react";

interface SettingsContentProps {
	title: string;
	isMobile: boolean;
	children: ReactNode;
}

export function SettingsContent({ title, isMobile, children }: SettingsContentProps) {
	return (
		<div className="flex h-full flex-col">
			{/* Mobile header with back button */}
			{isMobile && <MobileTopBar title={title} />}

			{/* Scrollable content with consistent padding */}
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="mx-auto max-w-5xl space-y-6 px-8 py-8 pb-4 lg:pt-12">{children}</div>
				</ScrollArea>
			</div>
		</div>
	);
}
