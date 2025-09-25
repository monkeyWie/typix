import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionPlanPage } from "./-components/SubscriptionPlanPage";

export const Route = createFileRoute("/subscription/plan")({
	component: SubscriptionPlanPage,
});
