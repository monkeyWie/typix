import type { ExecutionContext } from "hono";
import type { Resend } from "resend";
import type { DrizzleDb } from "../db";

interface ServiceContext {
	db: DrizzleDb;
	AI?: Ai;
	resend?: {
		instance: Resend;
		from: string;
	};
	providerCloudflareBuiltin?: boolean;
}

let serviceContext: ServiceContext | null = null;

export const localUserId = "GUEST";

export function initContext(context: ServiceContext): ServiceContext {
	serviceContext = context;
	return serviceContext;
}

export function getContext(): ServiceContext {
	if (!serviceContext) {
		throw new Error("Service context is not initialized");
	}
	return serviceContext;
}

export interface RequestContext {
	userId: string;
	executionCtx?: ExecutionContext;
}
