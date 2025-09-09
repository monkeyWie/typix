"use client";

import { Github, MessageCircle, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { TextLinkButton } from "./text-link-button";

export function Footer() {
	const t = useTranslations("footer");
	const nav = useTranslations("nav");
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		product: ["features", "gallery", "pricing"],
		community: ["github", "discord", "twitter"],
		support: ["docs", "faq", "contact"],
	};

	const categories: Record<string, string> = {
		product: t("categories.product"),
		community: t("categories.community"),
		support: t("categories.support"),
	};

	return (
		<footer className="linear-gradient-bg relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
			{/* Background decoration */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 blur-3xl" />
				<div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-gradient-to-l from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl" />
			</div>

			{/* Top divider */}
			<div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

			<div className="container relative z-10 mx-auto max-w-7xl">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
					{/* Brand Section */}
					<div className="lg:col-span-1">
						<div className="group mb-6 flex cursor-pointer items-center space-x-4">
							<div className="relative">
								<img
									src="logo.png"
									alt="Logo"
									className="glow shimmer h-12 w-12 rounded-2xl transition-transform duration-300 group-hover:scale-110"
								/>
							</div>
							<div className="flex flex-col">
								<span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text font-bold text-2xl text-transparent">
									Typix
								</span>
								<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									{nav("slogan")}
								</span>
							</div>
						</div>
						<p className="mb-8 text-muted-foreground leading-relaxed">{t("description")}</p>
						<div className="flex space-x-4">
							{[
								{ icon: Github, href: "https://github.com/typix-ai/typix", color: "hover:text-gray-400" },
								{ icon: Twitter, href: "https://x.com/JayPlayDota", color: "hover:text-blue-400" },
								{ icon: MessageCircle, href: "#", color: "hover:text-purple-400" },
							].map((social, index) => (
								<a
									key={social.href}
									href={social.href}
									className={`linear-card glow micro-interaction group flex h-11 w-11 items-center justify-center transition-all duration-300 hover:bg-accent ${social.color}`}
								>
									<social.icon className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
								</a>
							))}
						</div>
					</div>

					{/* Links Sections */}
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-3">
						{Object.entries(footerLinks).map(([category, links]) => (
							<div key={category}>
								<h3 className="mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text font-semibold text-foreground text-transparent">
									{categories[category]}
								</h3>
								<ul className="space-y-4">
									{links.map((link) => (
										<li key={link}>
											<TextLinkButton href={category === "product" ? `#${link}` : "#"} variant="footer">
												{t(`links.${category}.${link}`)}
											</TextLinkButton>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				{/* Bottom Section */}
				<div className="relative mt-16 pt-8">
					{/* Divider */}
					<div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

					<div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
						<p className="text-muted-foreground text-sm">{t("copyright", { year: currentYear })}</p>
						<div className="flex items-center space-x-8 text-sm">
							{[
								{ id: "privacy", label: t("legal.privacy") },
								{ id: "terms", label: t("legal.terms") },
							].map((item) => (
								<TextLinkButton key={item.id} href="#" variant="footer">
									{item.label}
								</TextLinkButton>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Bottom gradient */}
			<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
		</footer>
	);
}
