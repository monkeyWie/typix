"use client";

import { Cloud, Gift, Home, Layers, RefreshCw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

export function Features() {
	const t = useTranslations("features");

	const features = [
		{
			icon: Smartphone,
			emoji: "📱",
			key: "localFirst",
		},
		{
			icon: Home,
			emoji: "🏠",
			key: "selfHosted",
		},
		{
			icon: Gift,
			emoji: "🎁",
			key: "freeGeneration",
		},
		{
			icon: Cloud,
			emoji: "☁️",
			key: "oneClickDeploy",
		},
		{
			icon: Layers,
			emoji: "🤖",
			key: "multiModel",
		},
		{
			icon: RefreshCw,
			emoji: "🔄",
			key: "cloudSync",
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

				{/* Features Grid - Mobile First Approach */}
				<div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => {
						const Icon = feature.icon;

						return (
							<div key={feature.key} className="group relative">
								{/* Feature Card */}
								<div className="linear-card glow h-full p-6 transition-all duration-300 hover:scale-105 sm:p-8">
									{/* Icon Section */}
									<div className="mb-6 flex items-center justify-center">
										<div className="glow flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-shadow duration-300 group-hover:shadow-xl sm:h-24 sm:w-24">
											<Icon className="h-10 w-10 text-primary-foreground sm:h-12 sm:w-12" />
										</div>
									</div>

									{/* Content */}
									<div className="space-y-3 text-center">
										<h3 className="font-bold text-foreground text-xl sm:text-2xl">{t(`items.${feature.key}.title`)}</h3>

										<p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
											{t(`items.${feature.key}.subtitle`)}
										</p>
									</div>

									{/* Decorative Elements */}
									<div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
									<div className="absolute bottom-4 left-4 h-1 w-1 rounded-full bg-primary/20 opacity-0 transition-opacity delay-100 duration-300 group-hover:opacity-100" />
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
