import { integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { generateId, metaFields } from "../util";
import { user } from "./auth";

// 枚举定义
export const subscriptionTiers = ["basic", "advanced", "professional"] as const;
export const billingIntervals = ["month", "quarter", "year"] as const;
export const billingTypes = ["subscription", "one_time"] as const;
export const orderStatuses = ["pending", "paid", "failed", "cancelled", "refunded"] as const;
export const subscriptionStatuses = ["active", "cancelled", "expired", "pending"] as const;
export const creditSources = ["registration", "order", "gift", "promotion", "refund"] as const;

// 用户订单表 - 记录所有的购买行为
export const userOrders = sqliteTable("user_orders", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// 商品信息（对应PRODUCTS中的plan）
	planId: text().notNull(), // 对应购买的套餐计划ID
	tier: text({ enum: subscriptionTiers }).notNull(), // 套餐等级
	billingType: text({ enum: billingTypes }).notNull(), // subscription 或 one_time
	billingInterval: text({ enum: billingIntervals }).notNull(), // month, quarter, year

	// 订单状态
	status: text({ enum: orderStatuses }).notNull().default("pending"),

	// 金额信息
	originalPrice: real().notNull(), // 原价（美元，单位：分）
	finalPrice: real().notNull(), // 实际支付价格（美元，单位：分）
	currency: text().notNull().default("USD"), // 货币

	// 支付信息
	paymentMethod: text(), // 支付方式
	transactionId: text(), // 外部支付平台的交易ID
	checkoutSessionId: text(), // checkout session ID

	// 时间信息
	orderDate: text().notNull(), // 订单创建时间
	paidDate: text(), // 支付完成时间
	cancelledDate: text(), // 取消时间
	refundedDate: text(), // 退款时间

	// 商品内容
	creditsAmount: integer().notNull(), // 购买的额度数量
	validityDays: integer(), // 有效期天数（一次性购买为null，订阅制有值）

	// 其他信息
	notes: text(), // 备注
	metadata: text({ mode: "json" }), // 额外元数据（如优惠券信息等）

	...metaFields,
});

// 用户订阅表 - 记录用户当前的真实订阅状态
export const userSubscriptions = sqliteTable(
	"user_subscriptions",
	{
		id: text().$defaultFn(generateId).primaryKey(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		orderId: text()
			.notNull()
			.references(() => userOrders.id, { onDelete: "cascade" }), // 关联的订单

		// 订阅信息
		tier: text({ enum: subscriptionTiers }).notNull(),
		billingInterval: text({ enum: billingIntervals }).notNull(),

		// 订阅状态
		status: text({ enum: subscriptionStatuses }).notNull(),

		// 时间信息
		startDate: text().notNull(), // 订阅开始时间
		endDate: text(), // 订阅结束时间（一次性购买有具体结束时间，订阅制可能为null）
		nextBillingDate: text(), // 下次计费时间（仅订阅制有值）

		// 当前周期信息
		currentPeriodStart: text().notNull(), // 当前周期开始时间
		currentPeriodEnd: text().notNull(), // 当前周期结束时间

		// 自动续费设置（仅订阅制）
		autoRenew: integer({ mode: "boolean" }).default(true).notNull(),
		cancelAtPeriodEnd: integer({ mode: "boolean" }).default(false).notNull(),

		// 取消信息
		cancelledDate: text(), // 取消时间
		cancelReason: text(), // 取消原因

		...metaFields,
	},
	(t) => [unique().on(t.userId, t.tier)], // 一个用户同一套餐只能有一个活跃订阅
);

// 用户积分表
export const userCredits = sqliteTable("user_credits", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// 积分信息
	totalCredits: integer().default(0).notNull(), // 总积分
	usedCredits: integer().default(0).notNull(), // 已使用积分
	remainingCredits: integer().default(0).notNull(), // 剩余积分

	// 积分来源统计
	registrationCredits: integer().default(0).notNull(), // 注册赠送
	orderCredits: integer().default(0).notNull(), // 订单获得
	giftCredits: integer().default(0).notNull(), // 礼品积分
	promotionCredits: integer().default(0).notNull(), // 活动奖励

	...metaFields,
});

// 用户积分变更记录表
export const userCreditHistory = sqliteTable("user_credit_history", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// 变更信息
	source: text({ enum: creditSources }).notNull(),
	changeAmount: integer().notNull(), // 正数为增加，负数为减少
	beforeCredits: integer().notNull(),
	afterCredits: integer().notNull(),

	// 关联信息
	orderId: text().references(() => userOrders.id, { onDelete: "set null" }),
	subscriptionId: text().references(() => userSubscriptions.id, { onDelete: "set null" }),
	generationId: text().references(() => userGenerations.id, { onDelete: "set null" }),

	metadata: text({ mode: "json" }),

	...metaFields,
});

// 用户生成记录表（图片、视频等）
export const userGenerations = sqliteTable("user_generations", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// 生成信息
	generationType: text({ enum: ["image", "video"] })
		.notNull()
		.default("image"), // 生成类型
	modelId: text().notNull(),
	status: text({ enum: ["pending", "processing", "completed", "failed"] }).notNull(),
	creditsUsed: integer().default(1).notNull(),
	errorMessage: text(),

	// 输入参数
	prompt: text(),
	resultUrl: text(), // 生成的内容URL（图片或视频）

	...metaFields,
});
