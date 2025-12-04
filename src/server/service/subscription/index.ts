import * as crypto from "node:crypto";
import { user as userTable } from "@/server/db/schemas/auth";
import { userCreditHistory, userCredits, userOrders, userSubscriptions } from "@/server/db/schemas/subscription";
import { generateId } from "@/server/db/util";
import { ServiceException } from "@/server/lib/exception";
import { Creem } from "creem";
import { and, desc, eq } from "drizzle-orm";
import z from "zod/v4";
import { type RequestContext, getContext } from "../context";

export type BillingType = "one_time" | "subscription";
export type BillingInterval = "month" | "quarter" | "year";

export type Product = {
	tier: "basic" | "advanced" | "professional";
	description: string;
	credits: number;
	plans: {
		id: string;
		charged: BillingType;
		interval: BillingInterval;
		linePrice: number; // 原价
		price: number; // 实际价格（含优惠）
	}[];
};

export const PRODUCTS: Product[] = [
	// 基础档套餐
	{
		tier: "basic",
		description: "基础档套餐，包含基本功能",
		credits: 150,
		plans: [
			// 一次性购买
			{
				id: "prod_3PrXnZHWeB8Ri37rOwdVMZ",
				charged: "one_time",
				interval: "month",
				linePrice: 10,
				price: 10,
			},
			{
				id: "basic_one_time_quarter",
				charged: "one_time",
				interval: "quarter",
				linePrice: 30, // 10 * 3
				price: 27, // 季付-10%
			},
			{
				id: "basic_one_time_year",
				charged: "one_time",
				interval: "year",
				linePrice: 120, // 10 * 12
				price: 96, // 年付-20%
			},
			// 订阅制
			{
				id: "prod_14WmWICabykLJ50OMzjDp9",
				charged: "subscription",
				interval: "month",
				linePrice: 10,
				price: 10,
			},
			{
				id: "basic_subscription_quarter",
				charged: "subscription",
				interval: "quarter",
				linePrice: 30, // 10 * 3
				price: 27, // 季付-10%
			},
			{
				id: "basic_subscription_year",
				charged: "subscription",
				interval: "year",
				linePrice: 120, // 10 * 12
				price: 96, // 年付-20%
			},
		],
	},
	// 进阶档套餐
	{
		tier: "advanced",
		description: "进阶档套餐，包含高级功能",
		credits: 500,
		plans: [
			// 一次性购买
			{
				id: "advanced_one_time_month",
				charged: "one_time",
				interval: "month",
				linePrice: 30,
				price: 30,
			},
			{
				id: "advanced_one_time_quarter",
				charged: "one_time",
				interval: "quarter",
				linePrice: 90, // 30 * 3
				price: 81, // 季付-10%
			},
			{
				id: "advanced_one_time_year",
				charged: "one_time",
				interval: "year",
				linePrice: 360, // 30 * 12
				price: 288, // 年付-20%
			},
			// 订阅制
			{
				id: "advanced_subscription_month",
				charged: "subscription",
				interval: "month",
				linePrice: 30,
				price: 30,
			},
			{
				id: "advanced_subscription_quarter",
				charged: "subscription",
				interval: "quarter",
				linePrice: 90, // 30 * 3
				price: 81, // 季付-10%
			},
			{
				id: "advanced_subscription_year",
				charged: "subscription",
				interval: "year",
				linePrice: 360, // 30 * 12
				price: 288, // 年付-20%
			},
		],
	},
	// 专业档套餐
	{
		tier: "professional",
		description: "专业档套餐，包含所有高级功能",
		credits: 1500,
		plans: [
			// 一次性购买
			{
				id: "professional_one_time_month",
				charged: "one_time",
				interval: "month",
				linePrice: 80,
				price: 80,
			},
			{
				id: "professional_one_time_quarter",
				charged: "one_time",
				interval: "quarter",
				linePrice: 240, // 80 * 3
				price: 216, // 季付-10%
			},
			{
				id: "professional_one_time_year",
				charged: "one_time",
				interval: "year",
				linePrice: 960, // 80 * 12
				price: 768, // 年付-20%
			},
			// 订阅制
			{
				id: "professional_subscription_month",
				charged: "subscription",
				interval: "month",
				linePrice: 80,
				price: 80,
			},
			{
				id: "professional_subscription_quarter",
				charged: "subscription",
				interval: "quarter",
				linePrice: 240, // 80 * 3
				price: 216, // 季付-10%
			},
			{
				id: "professional_subscription_year",
				charged: "subscription",
				interval: "year",
				linePrice: 960, // 80 * 12
				price: 768, // 年付-20%
			},
		],
	},
];

const creem = new Creem({
	serverIdx: 1,
});

export const CreateCheckoutSchema = z.object({
	id: z.string(),
});
export type CreateCheckout = z.infer<typeof CreateCheckoutSchema>;
const createCheckout = async (req: CreateCheckout, ctx: RequestContext) => {
	if (!ctx.userEmail) {
		throw new ServiceException("unauthorized", "User email is required for creating checkout");
	}

	const { appURL, creemApiKey } = getContext();

	const resp = await creem.createCheckout({
		xApiKey: creemApiKey!,
		createCheckoutRequest: {
			productId: req.id,
			customer: {
				email: ctx.userEmail,
			},
			successUrl: `${appURL}/subscription/plan`,
		},
	});
	return {
		checkoutUrl: resp.checkoutUrl,
	};
};

export const HandleWebhookSchema = z.object({
	payload: z.string(),
	signature: z.string(),
});
export type HandleWebhook = z.infer<typeof HandleWebhookSchema>;
const handleWebhook = async (req: HandleWebhook) => {
	const payloadObj = JSON.parse(req.payload);
	if (payloadObj.eventType !== "checkout.completed") {
		// Only handle checkout.completed event
		return;
	}

	const { creemApiKey, creemWebhookSecret } = getContext();
	if (!creemApiKey || !creemWebhookSecret) {
		throw new ServiceException("error", "Creem API key or webhook secret is not configured");
	}

	// Verify signature
	const expectedSignature = generateSignature(req.payload, creemWebhookSecret);
	if (req.signature !== expectedSignature) {
		throw new ServiceException("invalid_parameter", "Invalid webhook signature");
	}

	// Persist order, subscription and reset credits
	const checkout = payloadObj.object;
	const customerEmail = checkout?.customer?.email;
	const productId = checkout?.product?.id;
	const checkoutSessionId = checkout?.id;
	const orderId = checkout?.order?.id;
	const transactionId = checkout?.order?.transaction;
	const amountPaid = checkout?.order?.amount_paid;
	const currency = checkout?.order?.currency;
	const orderType = checkout?.order?.type;

	if (!customerEmail || !productId) {
		throw new ServiceException("invalid_parameter", "Missing email or productId in webhook payload");
	}

	// Find user by email
	const { db } = getContext();
	const userRow = await db.select().from(userTable).where(eq(userTable.email, customerEmail)).limit(1);
	const user = userRow[0];
	if (!user) {
		throw new ServiceException("error", "User not found for webhook email");
	}

	// Map product to plan info
	const planInfo = PRODUCTS.flatMap((p) =>
		p.plans.map((pl) => ({
			productTier: p.tier,
			description: p.description,
			credits: p.credits,
			id: pl.id,
			charged: pl.charged,
			interval: pl.interval,
			linePrice: pl.linePrice,
			price: pl.price,
		})),
	).find((x) => x.id === productId);
	if (!planInfo) {
		throw new ServiceException("invalid_parameter", "Unknown productId");
	}

	const now = new Date();
	const periodEnd = calcPeriodEnd(now, planInfo.interval);

	// Create order (paid)
	const dbOrderId = generateId();
	await db.insert(userOrders).values({
		id: dbOrderId,
		userId: user.id,
		planId: planInfo.id,
		tier: planInfo.productTier,
		billingType: planInfo.charged,
		billingInterval: planInfo.interval,
		status: "paid",
		originalPrice: planInfo.linePrice,
		finalPrice: amountPaid ? amountPaid / 100 : planInfo.price, // Creem uses cents
		currency: currency || "USD",
		paymentMethod: "creem",
		transactionId: transactionId,
		checkoutSessionId,
		orderDate: now.toISOString(),
		paidDate: now.toISOString(),
		creditsAmount: planInfo.credits,
		validityDays: undefined,
	});

	// Create subscription record for both subscription and one_time
	if (orderType === "recurring" || planInfo.charged === "subscription") {
		const subscription = checkout?.subscription;
		const currentPeriodStart = subscription?.current_period_start_date
			? new Date(subscription.current_period_start_date).toISOString()
			: now.toISOString();
		const currentPeriodEnd = subscription?.current_period_end_date
			? new Date(subscription.current_period_end_date).toISOString()
			: periodEnd.toISOString();

		// Check if user already has an active subscription
		const existingSub = await db
			.select()
			.from(userSubscriptions)
			.where(
				and(
					eq(userSubscriptions.userId, user.id),
					eq(userSubscriptions.autoRenew, true),
					eq(userSubscriptions.status, "active"),
				),
			)
			.limit(1);

		if (existingSub.length > 0) {
			// Update existing subscription for renewal
			await db
				.update(userSubscriptions)
				.set({
					orderId: dbOrderId,
					currentPeriodStart: currentPeriodStart,
					currentPeriodEnd: currentPeriodEnd,
					nextBillingDate: currentPeriodEnd,
				})
				.where(eq(userSubscriptions.id, existingSub[0]!.id));
		} else {
			// Create new subscription for first-time purchase
			await db.insert(userSubscriptions).values({
				userId: user.id,
				orderId: dbOrderId,
				tier: planInfo.productTier,
				billingInterval: planInfo.interval,
				status: "active",
				startDate: currentPeriodStart,
				endDate: undefined,
				nextBillingDate: currentPeriodEnd,
				currentPeriodStart: currentPeriodStart,
				currentPeriodEnd: currentPeriodEnd,
				autoRenew: true,
				cancelAtPeriodEnd: false,
			});
		}
		// Expire old credits and add new period credits for subscription
		await expireAndAddCredits(user.id, planInfo.credits, planInfo.productTier);
	} else {
		// one_time: create subscription record but with autoRenew=false and set endDate
		await db.insert(userSubscriptions).values({
			userId: user.id,
			orderId: dbOrderId,
			tier: planInfo.productTier,
			billingInterval: planInfo.interval,
			status: "active",
			startDate: now.toISOString(),
			endDate: periodEnd.toISOString(),
			nextBillingDate: undefined,
			currentPeriodStart: now.toISOString(),
			currentPeriodEnd: periodEnd.toISOString(),
			autoRenew: false,
			cancelAtPeriodEnd: false,
		});
		// Add credits immediately for one_time purchase
		await incrementCredits(user.id, planInfo.credits, "order");
	}
};

function generateSignature(payload: string, secret: string): string {
	const computedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
	return computedSignature;
}

async function getUsage(ctx: { userId: string }) {
	const { db } = getContext();
	// Trigger lazy reset if needed
	await lazyResetIfNeeded(ctx.userId);
	// Get credits
	const credits = await getOrInitUserCredits(ctx.userId);
	if (!credits) throw new ServiceException("error", "User credits not initialized");
	// Get active subscription if any
	const subs = await db
		.select()
		.from(userSubscriptions)
		.where(and(eq(userSubscriptions.userId, ctx.userId), eq(userSubscriptions.status, "active")))
		.limit(1);
	const sub = subs[0];
	return {
		totalCredits: credits.totalCredits,
		usedCredits: credits.usedCredits,
		remainingCredits: credits.remainingCredits,
		currentPeriodStart: sub?.currentPeriodStart,
		currentPeriodEnd: sub?.currentPeriodEnd,
		tier: sub?.tier,
		billingInterval: sub?.billingInterval,
		autoRenew: sub?.autoRenew,
	};
}

async function getUsageHistory(ctx: { userId: string }) {
	const { db } = getContext();
	const history = await db
		.select()
		.from(userCreditHistory)
		.where(eq(userCreditHistory.userId, ctx.userId))
		.orderBy(desc(userCreditHistory.createdAt))
		.all();
	return history;
}

async function getOrderHistory(ctx: { userId: string }) {
	const { db } = getContext();
	const orders = await db
		.select()
		.from(userOrders)
		.where(eq(userOrders.userId, ctx.userId))
		.orderBy(desc(userOrders.createdAt))
		.all();
	return orders;
}

class SubscriptionService {
	createCheckout = createCheckout;
	handleWebhook = handleWebhook;
	lazyResetIfNeeded = lazyResetIfNeeded;
	getUsage = getUsage;
	getUsageHistory = getUsageHistory;
	getOrderHistory = getOrderHistory;
}

export const subscriptionService = new SubscriptionService();

function calcPeriodEnd(start: Date, interval: BillingInterval): Date {
	const d = new Date(start);
	if (interval === "month") {
		d.setMonth(d.getMonth() + 1);
	} else if (interval === "quarter") {
		d.setMonth(d.getMonth() + 3);
	} else {
		// year
		d.setFullYear(d.getFullYear() + 1);
	}
	return d;
}

async function getOrInitUserCredits(userId: string) {
	const { db } = getContext();
	const rows = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
	if (rows.length) return rows[0];
	await db.insert(userCredits).values({ userId, totalCredits: 0, usedCredits: 0, remainingCredits: 0 });
	return (await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1))[0]!;
}

async function addPeriodCredits(userId: string, credits: number, tier: Product["tier"]) {
	const { db } = getContext();
	const c = await getOrInitUserCredits(userId);
	if (!c) throw new ServiceException("error", "User credits not initialized");
	const before = c.remainingCredits;
	const newTotal = (c.totalCredits ?? 0) + credits;
	const newRemaining = before + credits;
	await db
		.update(userCredits)
		.set({ totalCredits: newTotal, remainingCredits: newRemaining })
		.where(eq(userCredits.userId, userId));
	await db.insert(userCreditHistory).values({
		userId,
		source: "order",
		changeAmount: credits,
		beforeCredits: before,
		afterCredits: newRemaining,
	});
}

async function expireCredits(userId: string, tier: Product["tier"]) {
	const { db } = getContext();
	const c = await getOrInitUserCredits(userId);
	if (!c) throw new ServiceException("error", "User credits not initialized");
	const before = c.remainingCredits;

	if (before > 0) {
		// Only record if there were credits to expire
		await db
			.update(userCredits)
			.set({ totalCredits: 0, usedCredits: 0, remainingCredits: 0 })
			.where(eq(userCredits.userId, userId));
		await db.insert(userCreditHistory).values({
			userId,
			source: "order",
			changeAmount: -before,
			beforeCredits: before,
			afterCredits: 0,
		});
	} else {
		// No credits to expire, just clear the record
		await db
			.update(userCredits)
			.set({ totalCredits: 0, usedCredits: 0, remainingCredits: 0 })
			.where(eq(userCredits.userId, userId));
	}
}

async function expireAndAddCredits(userId: string, credits: number, tier: Product["tier"]) {
	const { db } = getContext();
	const c = await getOrInitUserCredits(userId);
	if (!c) throw new ServiceException("error", "User credits not initialized");
	const before = c.remainingCredits;

	// Record expiration of old credits if any
	if (before > 0) {
		await db.insert(userCreditHistory).values({
			userId,
			source: "order",
			changeAmount: -before,
			beforeCredits: before,
			afterCredits: 0,
		});
	}

	// Add new period credits
	await db
		.update(userCredits)
		.set({ totalCredits: credits, usedCredits: 0, remainingCredits: credits })
		.where(eq(userCredits.userId, userId));
	await db.insert(userCreditHistory).values({
		userId,
		source: "order",
		changeAmount: credits,
		beforeCredits: 0,
		afterCredits: credits,
	});
}

async function incrementCredits(
	userId: string,
	amount: number,
	source: "registration" | "order" | "gift" | "promotion" | "refund",
) {
	const { db } = getContext();
	const c = await getOrInitUserCredits(userId);
	if (!c) throw new ServiceException("error", "User credits not initialized");
	const after = c.remainingCredits + amount;
	await db
		.update(userCredits)
		.set({ totalCredits: (c.totalCredits ?? 0) + amount, remainingCredits: after })
		.where(eq(userCredits.userId, userId));
	await db.insert(userCreditHistory).values({
		userId,
		source,
		changeAmount: amount,
		beforeCredits: c.remainingCredits,
		afterCredits: after,
	});
}

async function lazyResetIfNeeded(userId: string) {
	// If user has active subscription, ensure period credits are correct; else nothing
	const { db } = getContext();
	const subs = await db
		.select()
		.from(userSubscriptions)
		.where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, "active")))
		.limit(1);
	if (!subs.length) return; // no subscription
	const sub = subs[0]!;
	const now = new Date();
	const currentEnd = new Date(sub.currentPeriodEnd);

	if (now > currentEnd) {
		// Only handle one_time purchase (autoRenew=false) here
		// Subscription renewals are handled by Creem webhook
		if (!sub.autoRenew) {
			// One-time purchase: check if the entire package has expired
			const packageEnd = sub.endDate ? new Date(sub.endDate) : null;

			if (packageEnd && now > packageEnd) {
				// Package completely expired: mark as expired and clear credits
				await db
					.update(userSubscriptions)
					.set({
						status: "expired",
					})
					.where(eq(userSubscriptions.id, sub.id));
				// Clear all credits and record expiration
				await expireCredits(userId, sub.tier as Product["tier"]);
			} else {
				// Within package period: renew credits for next period
				const nextEnd = calcPeriodEnd(now, sub.billingInterval as BillingInterval);
				await db
					.update(userSubscriptions)
					.set({
						currentPeriodStart: now.toISOString(),
						currentPeriodEnd: nextEnd.toISOString(),
					})
					.where(eq(userSubscriptions.id, sub.id));
				// Add new period credits (not reset, add on top)
				const tierPlan = PRODUCTS.find((p) => p.tier === (sub.tier as Product["tier"]));
				if (tierPlan) await addPeriodCredits(userId, tierPlan.credits, tierPlan.tier);
			}
		}
	}
}
