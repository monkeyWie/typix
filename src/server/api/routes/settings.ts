import { UpdateSettingsSchema, settingsService } from "@/server/service/settings";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type Env, authMiddleware, ok } from "../util";

const app = new Hono<Env>()
	.basePath("/settings")
	.use(authMiddleware)
	.post("/updateSettings", zValidator("json", UpdateSettingsSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		await settingsService.updateSettings(req, { userId: user.id });
		return c.json(ok());
	})
	.post("/getSettings", async (c) => {
		const user = c.var.user!;

		return c.json(ok(await settingsService.getSettings({ userId: user.id })));
	});

export default app;
