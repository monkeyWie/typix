import {
	CreateChatSchema,
	CreateMessageSchema,
	GetChatByIdSchema,
	GetGenerationStatusSchema,
	UpdateChatSchema,
	chatService,
} from "@/server/service/chat";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type Env, authMiddleware, error, ok } from "../util";

const app = new Hono<Env>()
	.basePath("/chats")
	.use(authMiddleware)
	.post("/getChats", async (c) => {
		const user = c.var.user!;

		const userChats = await chatService.getChats({ userId: user.id });
		return c.json(ok(userChats));
	})
	.post("/createChat", zValidator("json", CreateChatSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await chatService.createChat(req, { userId: user.id })));
	})
	.post("/getChatById", zValidator("json", GetChatByIdSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		const chat = await chatService.getChatById(req, { userId: user.id });
		if (!chat) {
			return c.json(error("not_found", "Chat not found"));
		}

		return c.json(ok(chat));
	})
	.post("/deleteChat", zValidator("json", GetChatByIdSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		const success = await chatService.deleteChat(req, { userId: user.id });
		if (!success) {
			return c.json(error("not_found", "Chat not found"));
		}

		return c.json(ok({ success: true }));
	})
	.post("/updateChat", zValidator("json", UpdateChatSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		const success = await chatService.updateChat(req, { userId: user.id });
		return c.json(ok({ success }));
	})
	.post("/createMessage", zValidator("json", CreateMessageSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await chatService.createMessage(req, { userId: user.id, executionCtx: c.executionCtx })));
	})
	.post("/getGenerationStatus", zValidator("json", GetGenerationStatusSchema), async (c) => {
		const user = c.var.user!;
		const req = c.req.valid("json");

		return c.json(ok(await chatService.getGenerationStatus(req, { userId: user.id })));
	});

export default app;
