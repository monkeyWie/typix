import type { NavigationSection } from "@/app/components/navigation/NavigationSidebar";
import { CreditCard, FileText, TrendingUp } from "lucide-react";

export interface SubscriptionSection extends NavigationSection {}

/**
 * Subscription navigation sections configuration
 * Used by both desktop and mobile views
 * Note: The title field will be replaced with i18n keys at runtime
 */
export const subscriptionSections: SubscriptionSection[] = [
	{
		id: "plan",
		title: "subscription.sections.plan", // i18n key
		icon: CreditCard,
		path: "/subscription/plan",
	},
	{
		id: "usage",
		title: "subscription.sections.usage", // i18n key
		icon: TrendingUp,
		path: "/subscription/usage",
	},
	{
		id: "billing",
		title: "subscription.sections.billing", // i18n key
		icon: FileText,
		path: "/subscription/billing",
	},
];

/**
 * Get the default subscription section
 */
export const getDefaultSection = () => subscriptionSections[0]!;

/**
 * Find a subscription section by ID
 */
export const findSectionById = (sectionId: string) => subscriptionSections.find((section) => section.id === sectionId);

/**
 * Validate if a section ID exists in the configuration
 */
export const isValidSectionId = (sectionId: string) => subscriptionSections.some((section) => section.id === sectionId);
