import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { DrizzleDb } from "../db";
import type { createAuth } from "../lib/auth";
import type { Code } from "../lib/exception";

type Auth = ReturnType<typeof createAuth>;

export type Env = {
	Bindings: {
		DB: D1Database;
		AI: Ai;
		PROVIDER_CLOUDFLARE_BUILTIN?: boolean;
	};
	Variables: {
		db: DrizzleDb;
		auth: Auth;
		user: Auth["$Infer"]["Session"]["user"] | null;
		session: Auth["$Infer"]["Session"]["session"] | null;
	};
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
	// if path follow /api/xxx/no-auth/, skip auth check
	const regex = /^\/api\/[^/]+\/no-auth\//;
	if (regex.test(c.req.path)) {
		return await next();
	}

	const user = c.var.user;

	if (!user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}

	await next();
});

export interface ApiResult<T> {
	code: Code;
	data?: T;
	message?: string;
}

export function ok<T>(data?: T): ApiResult<T> {
	return { code: "ok", data };
}

export function error<T>(code: Code, message: string): ApiResult<T> {
	return { code, message };
}
