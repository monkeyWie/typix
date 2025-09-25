import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/subscription/billing")({
	component: SubscriptionBillingPage,
});

function SubscriptionBillingPage() {
	const { t } = useTranslation();

	return (
		<div className="p-6">
			<div className="mx-auto max-w-4xl">
				<h1 className="mb-6 font-semibold text-3xl">{t("subscription.sections.billing")}</h1>
				<div className="rounded-lg border bg-card p-8 text-center">
					<p className="text-muted-foreground">{t("common.comingSoon")}</p>
				</div>
			</div>
		</div>
	);
}
