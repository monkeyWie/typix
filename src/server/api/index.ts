import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { createDb } from "../db";
import { createAuth } from "../lib/auth";
import { ServiceException } from "../lib/exception";
import { initContext } from "../service/context";
import aiRouter from "./routes/ai";
import chatsRouter from "./routes/chat";
import fileRouter from "./routes/file";
import userRouter from "./routes/settings";
import type { ApiResult, Env } from "./util";

const factory = createFactory<Env>({
	initApp: async (app) => {
		app.use(async (c, next) => {
			const db = await createDb(c.env.DB);
			c.set("db", db);
			c.set("auth", createAuth(db));
			initContext({
				db,
				AI: c.env.AI,
				PROVIDER_CLOUDFLARE_BUILTIN: c.env.PROVIDER_CLOUDFLARE_BUILTIN || false,
			});
			await next();
		});
	},
});

const app = factory.createApp();

app.use(logger());

app.use("*", async (c, next) => {
	const session = await c.var.auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return await next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return await next();
});

app.on(["POST", "GET"], ["/api/auth/*"], (c) => c.var.auth.handler(c.req.raw));

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json<ApiResult<unknown>>(
			{
				code: (() => {
					switch (err.status) {
						case 401:
							return "unauthorized";
						case 403:
							return "forbidden";
						case 404:
							return "not_found";
						default:
							return "error";
					}
				})(),
				message: err.message,
			},
			err.status,
		);
	}

	if (err instanceof ServiceException) {
		return c.json<ApiResult<unknown>>(
			{
				code: err.code,
				message: err.message,
			},
			200,
		);
	}

	console.error("Unhandled error:", err);
	return c.json<ApiResult<unknown>>({
		code: "error",
		message: "Internal Server Error",
	});
});

const route = app
	.basePath("/api")
	.route("/", chatsRouter)
	.route("/", userRouter)
	.route("/", aiRouter)
	.route("/", fileRouter);

export type AppType = typeof route;
export default app;
