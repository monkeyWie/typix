"use client";

import type { LucideIcon } from "lucide-react";

interface TextLinkButtonProps {
	href: string;
	children: React.ReactNode;
	external?: boolean;
	variant?: "header-desktop" | "header-mobile" | "footer";
	icon?: LucideIcon;
	onClick?: () => void;
	className?: string;
}

export function TextLinkButton({
	href,
	children,
	external = false,
	variant = "footer",
	icon: Icon,
	onClick,
	className = "",
}: TextLinkButtonProps) {
	const baseClasses = "group transition-all duration-300 relative";

	const variantClasses = {
		"header-desktop":
			"flex items-center px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground bg-transparent hover:bg-background/60 backdrop-blur-md hover:shadow-lg hover:scale-105",
		"header-mobile":
			"flex items-center space-x-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/10",
		footer: "text-muted-foreground hover:text-foreground micro-interaction",
	};

	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
			className={`${baseClasses} ${variantClasses[variant]} ${className}`}
			onClick={onClick}
		>
			{Icon && variant === "header-mobile" && (
				<Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
			)}
			<span>{children}</span>
			{(variant === "header-desktop" || variant === "footer") && (
				<div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full" />
			)}
		</a>
	);
}
