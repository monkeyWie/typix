"use client";

import { Brain, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

const modelIcons = {
	nanoBanana: Sparkles,
	fluxKontext: Zap,
	gpt4o: Brain,
};

export function FeaturedModels() {
	const t = useTranslations("models");

	const models = [
		{
			key: "nanoBanana",
			icon: modelIcons.nanoBanana,
			gradient: "from-yellow-400 to-orange-500",
			bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20",
		},
		{
			key: "fluxKontext",
			icon: modelIcons.fluxKontext,
			gradient: "from-purple-400 to-pink-500",
			bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
		},
		{
			key: "gpt4o",
			icon: modelIcons.gpt4o,
			gradient: "from-blue-400 to-cyan-500",
			bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
		},
	];

	return (
		<section className="px-4 py-16 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="mb-4 font-bold text-3xl sm:mb-6 sm:text-4xl lg:text-5xl">
						<span className="gradient-text">{t("title")}</span>
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
						{t("subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{models.map((model) => {
						const Icon = model.icon;
						const features = t.raw(`items.${model.key}.features`) as string[];

						return (
							<div
								key={model.key}
								className="linear-card glow hover:-translate-y-1 relative transform overflow-hidden transition-all duration-300 hover:scale-105"
							>
								<div className="p-6 pb-4">
									<div
										className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${model.gradient} mb-4`}
									>
										<Icon className="h-6 w-6 text-white" />
									</div>
									<h3 className="mb-2 font-bold text-foreground text-xl dark:text-white">
										{t(`items.${model.key}.name`)}
									</h3>
									<p className="mb-4 text-muted-foreground leading-relaxed">{t(`items.${model.key}.description`)}</p>
								</div>
								<div className="px-6 pb-6">
									<div className="flex flex-wrap gap-2">
										{features.map((feature) => (
											<span
												key={feature}
												className="inline-flex items-center rounded-full border border-border/20 bg-muted/80 px-3 py-1 font-medium text-muted-foreground text-sm backdrop-blur-sm"
											>
												{feature}
											</span>
										))}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
