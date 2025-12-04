import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useSubscriptionService } from "@/app/hooks/useService";
import { useToast } from "@/app/hooks/useToast";
import { apiClient } from "@/app/lib/api-client";
import { useUIStore } from "@/app/stores";
import { ServiceException } from "@/server/lib/exception";
import type { BillingInterval, BillingType, Product } from "@/server/service/subscription";
import { PRODUCTS } from "@/server/service/subscription";
import { Check, Crown, Mail, Shield, Star, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CurrentSubscription {
	totalCredits: number;
	usedCredits: number;
	remainingCredits: number;
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	tier?: string;
	billingInterval?: BillingInterval;
	autoRenew?: boolean;
}

interface PlanCardProps {
	product: Product;
	isPopular?: boolean;
	billingType: BillingType;
	billingCycle: BillingInterval;
	currentSubscription?: CurrentSubscription;
}

function PlanCard({ product, isPopular, billingType, billingCycle, currentSubscription }: PlanCardProps) {
	const { t } = useTranslation();
	const subscriptionService = useSubscriptionService();
	const { openLoginModal } = useUIStore();
	const { toast } = useToast();

	// Check if this is the current plan
	const plan = product.plans.find((p) => p.charged === billingType && p.interval === billingCycle);
	const isCurrentPlan =
		currentSubscription?.tier === product.tier &&
		currentSubscription?.billingInterval === billingCycle &&
		((billingType === "subscription" && currentSubscription?.autoRenew === true) ||
			(billingType === "one_time" && currentSubscription?.autoRenew === false));

	const { trigger: createCheckout, isMutating: isLoading } = subscriptionService.createCheckout.swrMutation(
		"createCheckout",
		{
			onSuccess: (result) => {
				if (result.checkoutUrl) {
					window.location.href = result.checkoutUrl;
				} else {
					toast({
						title: t("subscription.error.title"),
						description: t("subscription.error.noCheckoutUrl"),
						variant: "destructive",
					});
				}
			},
			onError: (error) => {
				console.error("Failed to create checkout:", error);
				if (error instanceof ServiceException && error.code === "unauthorized") {
					openLoginModal(`${window.location.origin}/subscription/plan`);
					return;
				}
				toast({
					title: t("subscription.error.title"),
					description: t("subscription.error.createCheckoutFailed"),
					variant: "destructive",
				});
			},
		},
	);

	if (!plan) {
		return null;
	}

	// Calculate months for different billing cycles
	const getMonths = (interval: BillingInterval): number => {
		switch (interval) {
			case "month":
				return 1;
			case "quarter":
				return 3;
			case "year":
				return 12;
			default:
				return 1;
		}
	};

	const months = getMonths(billingCycle);
	const totalCredits = product.credits * months;
	const costPerImage = plan.price / totalCredits;

	const tierIcons = {
		basic: Shield,
		advanced: Zap,
		professional: Crown,
	};
	const tierColors = {
		basic: "text-blue-600",
		advanced: "text-purple-600",
		professional: "text-amber-600",
	};

	const TierIcon = tierIcons[product.tier];
	const hasDiscount = plan.price < plan.linePrice;
	const discountPercent = hasDiscount ? Math.round(((plan.linePrice - plan.price) / plan.linePrice) * 100) : 0;

	const handleSubscribe = async () => {
		if (!plan) return;

		await createCheckout({ id: plan.id });
	};

	return (
		<Card className="relative">
			{isPopular && (
				<div className="-top-3 -translate-x-1/2 absolute left-1/2">
					<Badge variant="default" className="px-3 py-1">
						{t("subscription.popular")}
					</Badge>
				</div>
			)}

			<CardHeader className="text-center">
				<div
					className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted ${tierColors[product.tier]}`}
				>
					<TierIcon className="h-6 w-6" />
				</div>
				<CardTitle className="text-xl capitalize">{t(`subscription.tiers.${product.tier}`)}</CardTitle>
				<CardDescription>{t(`subscription.descriptions.${product.tier}`)}</CardDescription>
			</CardHeader>

			<CardContent className="text-center">
				<div className="mb-6">
					<div className="flex items-baseline justify-center gap-1">
						{hasDiscount && <span className="text-muted-foreground text-sm line-through">${plan.linePrice}</span>}
						<span className="font-bold text-3xl">${plan.price}</span>
					</div>
					{hasDiscount && (
						<div className="mt-1">
							<Badge variant="secondary" className="text-xs">
								{t("subscription.save")} {discountPercent}%
							</Badge>
						</div>
					)}
				</div>

				<div className="mb-6">
					{isCurrentPlan ? (
						<Button className="w-full" variant="secondary" disabled>
							{t("subscription.currentPlan")}
						</Button>
					) : (
						<Button className="w-full" variant="default" onClick={handleSubscribe} disabled={isLoading || !plan}>
							{isLoading
								? t("subscription.loading")
								: billingType === "subscription"
									? t("subscription.subscribe")
									: t("subscription.buyNow")}
						</Button>
					)}
				</div>

				<ul className="space-y-2 text-left text-sm">
					<li className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						<span>
							{product.credits} {t("subscription.creditsUnit")}
							<span className="ml-1 text-muted-foreground">
								(${costPerImage.toFixed(3)}/{t("subscription.perImage")})
							</span>
						</span>
					</li>
					<li className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						{t("subscription.features.allModels")}
					</li>
					<li className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						{t("subscription.features.batchGeneration")}
					</li>
					<li className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						{t("subscription.features.imageEditing")}
					</li>
					<li className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						{product.tier === "basic" && t("subscription.features.basicSupport")}
						{product.tier === "advanced" && t("subscription.features.prioritySupport")}
						{product.tier === "professional" && t("subscription.features.premiumSupport")}
					</li>
				</ul>
			</CardContent>
		</Card>
	);
}

export function SubscriptionPlanPage() {
	const { t } = useTranslation();
	const [billingType, setBillingType] = useState<BillingType>("subscription");
	const [billingCycle, setBillingCycle] = useState<BillingInterval>("month");
	const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);

	useEffect(() => {
		apiClient.api.subscription.usage
			.$post({})
			.then((res) => res.json())
			.then((res) => {
				if (res.code === "ok" && res.data) {
					setCurrentSubscription(res.data as CurrentSubscription);
				}
			})
			.catch(() => {
				// Ignore errors - user might not be logged in
			});
	}, []);

	return (
		<div className="min-h-screen p-4 md:p-6">
			<div className="mx-auto max-w-6xl">
				{/* Current Subscription Banner */}
				{currentSubscription && currentSubscription.totalCredits > 0 && (
					<Card className="mb-6 bg-primary/5 md:mb-8">
						<CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<Star className="h-5 w-5 text-primary" />
								</div>
								<div>
									<div className="font-semibold">
										{currentSubscription.tier ? (
											<>当前订阅：{t(`subscription.tiers.${currentSubscription.tier}`)}</>
										) : (
											"当前额度"
										)}
									</div>
									{currentSubscription.currentPeriodEnd ? (
										<div className="text-muted-foreground text-sm">
											到期时间：{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("zh-CN")}
										</div>
									) : (
										<div className="text-muted-foreground text-sm">无有效期限制</div>
									)}
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-center">
									<div className="text-muted-foreground text-xs">剩余积分</div>
									<div className="font-bold text-xl">{currentSubscription.remainingCredits}</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Header */}
				<div className="mb-6 text-center md:mb-8">
					<h1 className="mb-4 font-bold text-3xl md:text-4xl">{t("subscription.title")}</h1>
					<p className="text-base text-muted-foreground md:text-lg">{t("subscription.subtitle")}</p>
				</div>

				{/* Billing Type Tabs */}
				<div className="mb-6 md:mb-8">
					<Tabs value={billingType} onValueChange={(value: string) => setBillingType(value as BillingType)}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="subscription">{t("subscription.types.subscription")}</TabsTrigger>
							<TabsTrigger value="one_time">{t("subscription.types.oneTime")}</TabsTrigger>
						</TabsList>

						<TabsContent value="subscription">
							<div className="text-center text-muted-foreground text-sm">
								{t("subscription.types.subscriptionDescription")}
							</div>
						</TabsContent>

						<TabsContent value="one_time">
							<div className="text-center text-muted-foreground text-sm">
								{t("subscription.types.oneTimeDescription")}
							</div>
						</TabsContent>
					</Tabs>
				</div>

				{/* Billing Cycle Selector */}
				<div className="mb-6 md:mb-8">
					<Tabs value={billingCycle} onValueChange={(value: string) => setBillingCycle(value as BillingInterval)}>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="month">{t("subscription.intervals.month")}</TabsTrigger>
							<TabsTrigger value="quarter">
								{t("subscription.intervals.quarter")}
								<Badge variant="secondary" className="ml-2 text-xs">
									-10%
								</Badge>
							</TabsTrigger>
							<TabsTrigger value="year">
								{t("subscription.intervals.year")}
								<Badge variant="secondary" className="ml-2 text-xs">
									-20%
								</Badge>
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Pricing Cards */}
				<div className="grid gap-4 md:grid-cols-3 md:gap-6">
					{PRODUCTS.map((product, index) => (
						<PlanCard
							key={product.tier}
							product={product}
							isPopular={index === 1} // Make "advanced" tier popular
							billingType={billingType}
							billingCycle={billingCycle}
							currentSubscription={currentSubscription || undefined}
						/>
					))}
				</div>

				{/* FAQ Section */}
				<div className="mt-12 md:mt-16">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">{t("subscription.faq.title")}</h2>
					<div className="grid gap-6 md:grid-cols-2">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<Card key={i} className="p-6">
								<h3 className="mb-3 font-semibold text-lg">{t(`subscription.faq.questions.q${i}.question`)}</h3>
								<div className="text-muted-foreground text-sm leading-relaxed">
									{i === 5 ? (
										<span>
											{t("subscription.faq.questions.q5.answer.beforeLink")}
											<a href="/models" className="mx-1 underline">
												{t("subscription.faq.questions.q5.answer.linkText")}
											</a>
											{t("subscription.faq.questions.q5.answer.afterLink")}
										</span>
									) : (
										t(`subscription.faq.questions.q${i}.answer`)
									)}
								</div>
							</Card>
						))}
					</div>
				</div>

				{/* Support Section */}
				<div className="mt-12 md:mt-16">
					<div className="mb-8 text-center">
						<h2 className="mb-2 font-bold text-2xl md:text-3xl">{t("subscription.support.title")}</h2>
						<p className="text-muted-foreground">{t("subscription.support.description")}</p>
					</div>
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
						<Button variant="outline" className="flex h-auto min-w-[160px] items-center justify-center gap-3 px-8 py-3">
							<Users className="h-5 w-5 text-blue-600" />
							<span className="font-medium">{t("subscription.support.community.title")}</span>
						</Button>
						<Button variant="outline" className="flex h-auto min-w-[160px] items-center justify-center gap-3 px-8 py-3">
							<Mail className="h-5 w-5 text-green-600" />
							<span className="font-medium">{t("subscription.support.email.title")}</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
