import { getProviderById } from "@/server/ai/provider";
import type { TypixChatApiResponse } from "@/server/ai/types/api";
import { ConfigInvalidError } from "@/server/ai/types/provider";
import { ServiceException } from "@/server/lib/exception";
import {
	GetAiModelsByProviderIdSchema,
	GetAiProviderByIdSchema,
	UpdateAiModelSchema,
	UpdateAiProviderSchema,
	aiService,
} from "@/server/service/ai";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod/v4";
import { type Env, authMiddleware, ok } from "../util";

const app = new Hono<Env>()
	.basePath("/ai")
	.use(authMiddleware)
	.post("/getAiProviders", async (c) => {
		const user = c.var.user!;

		return c.json(ok(await aiService.getAiProviders({ userId: user.id })));
	})
	.post("/getAiProviderById", zValidator("json", GetAiProviderByIdSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await aiService.getAiProviderById(req, { userId: user.id })));
	})
	.post("/getEnabledAiProvidersWithModels", async (c) => {
		const user = c.var.user!;

		return c.json(ok(await aiService.getEnabledAiProvidersWithModels({ userId: user.id })));
	})
	.post("/updateAiProvider", zValidator("json", UpdateAiProviderSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await aiService.updateAiProvider(req, { userId: user.id })));
	})
	.post("/getAiModelsByProviderId", zValidator("json", GetAiModelsByProviderIdSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await aiService.getAiModelsByProviderId(req, { userId: user.id })));
	})
	.post("/updateAiModel", zValidator("json", UpdateAiModelSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await aiService.updateAiModel(req, { userId: user.id })));
	})
	.post(
		"/no-auth/:providerId/generate",
		zValidator(
			"json",
			z.object({
				request: z.any(),
				settings: z.any(),
			}),
		),
		async (c) => {
			const req = c.req.valid("json");
			const providerId = c.req.param("providerId");

			const aiProviderInstance = getProviderById(providerId);
			if (!aiProviderInstance) {
				throw new ServiceException("not_found", "AI provider not found in system");
			}

			try {
				const response = await aiProviderInstance.generate(req.request, req.settings);
				return c.json(ok(response));
			} catch (error) {
				if (error instanceof ConfigInvalidError) {
					return c.json(ok({ errorReason: "CONFIG_INVALID", images: [] } as TypixChatApiResponse));
				}
				throw error;
			}
		},
	);

export default app;
