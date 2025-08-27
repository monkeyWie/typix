"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function Providers() {
	const t = useTranslations("providers");

	// Placeholder data structure - you can replace with actual SVG URLs
	const providers = [
		{
			name: "Google",
			logo: "https://unpkg.com/@lobehub/icons-static-svg@1.57.0/icons/google.svg",
		},
		{
			name: "OpenAI",
			logo: "https://unpkg.com/@lobehub/icons-static-svg@1.57.0/icons/openai.svg",
		},
		{
			name: "Flux",
			logo: "https://unpkg.com/@lobehub/icons-static-svg@1.57.0/icons/flux.svg",
		},
		{
			name: "Fal",
			logo: "https://unpkg.com/@lobehub/icons-static-svg@1.57.0/icons/fal.svg",
		},
		{
			name: "Cloudflare",
			logo: "https://unpkg.com/@lobehub/icons-static-svg@1.57.0/icons/cloudflare.svg",
		},
	];

	return (
		<section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
			<div className="container mx-auto max-w-7xl">
				{/* Section Header */}
				<div className="mb-16 text-center sm:mb-20">
					<h2 className="mb-4 font-bold text-3xl sm:mb-6 sm:text-4xl lg:text-5xl">
						<span className="gradient-text">{t("title")}</span>
					</h2>
					<p className="mx-auto max-w-3xl text-lg text-muted-foreground leading-relaxed sm:text-xl">{t("subtitle")}</p>
				</div>

				{/* Providers Grid */}
				<div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6 sm:gap-8">
					{providers.map((provider, index) => (
						<motion.div
							key={provider.name}
							className="group relative w-40 sm:w-44 md:w-48 lg:w-52"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.5,
								delay: index * 0.1,
								ease: "easeOut",
							}}
						>
							{/* Provider Card */}
							<motion.div
								className="linear-card glow flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:scale-105 group-hover:shadow-xl sm:p-8"
								whileHover={{ y: -5 }}
								transition={{ duration: 0.2 }}
							>
								{/* Logo Container */}
								<div className="mb-4 flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
									<motion.div
										className="flex h-full w-full items-center justify-center rounded-2xl border border-border/20 bg-muted/20 transition-colors duration-300 group-hover:border-primary/30"
										whileHover={{ rotate: [0, -5, 5, 0] }}
										transition={{ duration: 0.3 }}
									>
										<img
											src={provider.logo}
											alt={`${provider.name} logo`}
											className="h-10 w-10 sm:h-12 sm:w-12"
											style={{
												filter: "var(--logo-filter, none)",
											}}
										/>
									</motion.div>
								</div>

								{/* Provider Name */}
								<h3 className="mt-2 font-semibold text-foreground text-sm transition-colors duration-300 group-hover:text-primary sm:text-base">
									{provider.name}
								</h3>

								{/* Hover Effect Indicator */}
								<motion.div
									className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									initial={{ scale: 0 }}
									whileHover={{ scale: 1 }}
								/>
							</motion.div>
						</motion.div>
					))}
				</div>

				{/* Bottom Text */}
				<motion.div
					className="mt-12 text-center sm:mt-16"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.8 }}
				>
					<p className="text-muted-foreground text-sm sm:text-base">{t("footer")}</p>
				</motion.div>
			</div>
		</section>
	);
}
