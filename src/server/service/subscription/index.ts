import { ServiceException } from "@/server/lib/exception";
import { Creem } from "creem";
import z from "zod/v4";
import { type RequestContext, getContext } from "../context";

export type BillingType = "one_time" | "subscription";
export type BillingInterval = "month" | "quarter" | "year";

export type Product = {
	tier: "basic" | "advanced" | "professional";
	description: string;
	quota: number;
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
		quota: 150,
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
		quota: 500,
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
		quota: 1500,
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

class SubscriptionService {
	createCheckout = createCheckout;
}

export const subscriptionService = new SubscriptionService();
