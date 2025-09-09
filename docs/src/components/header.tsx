"use client";

import { ExternalLink, Github, type LucideIcon, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageToggle } from "./language-toggle";
import { TextLinkButton } from "./text-link-button";
import { ThemeToggle } from "./theme-toggle";

// Navigation items configuration
interface NavItem {
	key: string;
	href: string;
	icon: LucideIcon;
	external?: boolean;
}

const navigationItems: NavItem[] = [
	{
		key: "github",
		href: "https://github.com/monkeyWie/typix",
		icon: Github,
		external: true,
	},
	{
		key: "docs",
		href: "https://github.com/monkeyWie/typix#%EF%B8%8F-development-documentation",
		icon: ExternalLink,
		external: true,
	},
];

export function Header() {
	const t = useTranslations("nav");
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const renderNavItem = (item: NavItem, isMobile = false) => {
		const label = item.key === "docs" ? "Docs" : t(item.key);

		return (
			<TextLinkButton
				key={item.key}
				href={item.href}
				external={item.external}
				variant={isMobile ? "header-mobile" : "header-desktop"}
				icon={item.icon}
				onClick={isMobile ? () => setIsMenuOpen(false) : undefined}
			>
				{label}
			</TextLinkButton>
		);
	};

	return (
		<header className="absolute top-0 right-0 left-0 z-50 px-4 py-6 sm:px-6 lg:px-8">
			<div className="container mx-auto max-w-7xl">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<div className="flex items-center space-x-4">
						<img src="logo.png" alt="Logo" className="h-14 w-14" />
						<div className="flex flex-col">
							<span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text font-bold text-2xl text-transparent">
								Typix
							</span>
							<span className="-mt-1 text-muted-foreground text-sm">{t("slogan")}</span>
						</div>
					</div>

					{/* Right Side */}
					<div className="flex items-center space-x-2">
						{/* Desktop Navigation */}
						<div className="hidden items-center space-x-2 md:flex">
							{navigationItems.map((item) => renderNavItem(item))}

							{/* Divider */}
							<div className="mx-2 h-6 w-px bg-border/30" />
						</div>

						{/* Theme and Language Toggles - Always visible */}
						<ThemeToggle />
						<LanguageToggle />

						{/* Mobile Menu Button */}
						<button
							type="button"
							onClick={toggleMenu}
							className="rounded-full border border-border/20 p-2 text-muted-foreground backdrop-blur-sm transition-colors duration-300 hover:border-border/40 hover:bg-accent/10 hover:text-foreground hover:backdrop-blur-md md:hidden"
							aria-label="Toggle menu"
						>
							{isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				{isMenuOpen && (
					<div className="mt-4 rounded-2xl border border-border/20 bg-background/80 p-4 shadow-lg backdrop-blur-md md:hidden">
						<div className="flex flex-col space-y-3">{navigationItems.map((item) => renderNavItem(item, true))}</div>
					</div>
				)}
			</div>
		</header>
	);
}
