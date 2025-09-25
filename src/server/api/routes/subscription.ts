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
	});

export default app;
