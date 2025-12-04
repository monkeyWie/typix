import { getContext } from "@/server/service/context";
import { CreateCheckoutSchema, subscriptionService } from "@/server/service/subscription";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type Env, authMiddleware, ok } from "../util";

const app = new Hono<Env>()
	.basePath("/subscription")
	.use(authMiddleware)
	.post("/createCheckout", zValidator("json", CreateCheckoutSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await subscriptionService.createCheckout(req, { userId: user.id, userEmail: user.email })));
	})
	.post("/usage", async (c) => {
		const user = c.var.user!;
		return c.json(ok(await subscriptionService.getUsage({ userId: user.id })));
	})
	.post("/usageHistory", async (c) => {
		const user = c.var.user!;
		return c.json(ok(await subscriptionService.getUsageHistory({ userId: user.id })));
	})
	.post("/orderHistory", async (c) => {
		const user = c.var.user!;
		return c.json(ok(await subscriptionService.getOrderHistory({ userId: user.id })));
	})
	.post("/no-auth/webhooks", async (c) => {
		const payload = await c.req.text();
		const signature = c.req.header("creem-signature") || "";

		return c.json(ok(await subscriptionService.handleWebhook({ payload, signature })));
	});

export default app;
