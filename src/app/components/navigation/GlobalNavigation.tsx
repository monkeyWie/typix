import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Compass, Github, MessageSquare, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GlobalNavigationProps {
	className?: string;
}

export function GlobalNavigation({ className }: GlobalNavigationProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	// Navigation items configuration - using i18n for labels
	const navigationItems = [
		{
			id: "chat",
			label: t("navigation.chat"),
			icon: MessageSquare,
			href: "/chat",
		},
		{
			id: "settings",
			label: t("navigation.settings"),
			icon: Settings,
			href: "/settings",
		},
	];

	// Check if current path matches navigation item
	const isActive = (href: string) => {
		if (href === "/") {
			// Home page should be active for root path only
			return location.pathname === "/";
		}
		// For other pages, exact match or sub-routes
		return location.pathname === href || location.pathname.startsWith(`${href}/`);
	};

	// Handle navigation - clear any search params for clean URLs
	const handleNavigation = (href: string) => (e: React.MouseEvent) => {
		e.preventDefault();
		navigate({ to: href, search: {} });
	};

	return (
		<nav
			className={cn(
				// Base styles
				"flex border-border bg-background/95 backdrop-blur-lg",
				// Desktop: vertical sidebar on left
				"md:fixed md:top-0 md:left-0 md:z-40 md:h-full md:w-16 md:flex-col md:border-r",
				// Mobile: horizontal bottom bar
				"fixed bottom-0 left-0 z-50 h-16 w-full flex-row border-t md:h-full md:w-16 md:border-t-0 md:border-r",
				className,
			)}
		>
			{/* Desktop: vertical layout */}
			<div className="hidden h-full flex-col items-center pt-2 pb-4 md:flex">
				{/* App logo/brand */}
				<a
					href="https://typix.art/home"
					// biome-ignore lint/a11y/noBlankTarget: <explanation>
					target="_blank"
					className="mb-2 flex h-14 w-14 items-center justify-center transition-all duration-200 hover:scale-105"
				>
					<img src="/logo.png" alt="Logo" className="h-12 w-12" />
				</a>

				{/* Navigation items */}
				<div className="flex flex-col gap-2">
					{navigationItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<Button
								key={item.id}
								variant="ghost"
								size="icon"
								className={cn(
									"h-10 w-10 transition-all duration-200 hover:scale-105",
									active
										? "bg-primary/10 text-primary hover:bg-primary/15"
										: "text-muted-foreground hover:bg-accent hover:text-foreground",
								)}
								onClick={handleNavigation(item.href)}
							>
								<Icon className="size-6" />
								{/* Active indicator */}
								{active && (
									<div className="-left-4 -translate-y-1/2 absolute top-1/2 h-6 w-1 rounded-full bg-primary transition-all duration-200" />
								)}
							</Button>
						);
					})}
				</div>

				{/* GitHub link at bottom */}
				<div className="mt-auto">
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-foreground"
						onClick={() => window.open("https://github.com/monkeyWie/typix", "_blank")}
					>
						<Github className="size-6" />
					</Button>
				</div>
			</div>

			{/* Mobile: horizontal layout */}
			<div className="flex h-full w-full items-center justify-around px-2 py-1 md:hidden">
				{navigationItems.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.href);

					return (
						<Button
							key={item.id}
							variant="ghost"
							className={cn(
								"relative h-full min-h-[3rem] flex-1 flex-col gap-1 rounded-none px-2 py-2 transition-all duration-200 hover:bg-transparent",
								active ? "text-primary" : "text-muted-foreground hover:text-foreground",
							)}
							onClick={handleNavigation(item.href)}
						>
							<Icon className={cn("h-5 w-5 transition-all duration-200", active && "scale-110 text-primary")} />
							<span
								className={cn(
									"font-medium text-xs transition-all duration-200",
									active ? "font-semibold text-primary" : "text-muted-foreground",
								)}
							>
								{item.label}
							</span>
							{/* Active indicator for mobile */}
							{active && (
								<div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-1 w-8 rounded-full bg-primary transition-all duration-200" />
							)}
						</Button>
					);
				})}
			</div>
		</nav>
	);
}
