import { inCfWorker } from "@/server/lib/env";
import * as schema from "./schemas/index";

export const createDb = async (client: any) => {
	if (inCfWorker) {
		const { drizzle } = await import("drizzle-orm/d1");
		return drizzle(client, { schema, casing: "snake_case" });
	}
	const { drizzle } = await import("drizzle-orm/libsql");
	const { client: sqliteClient } = await import("./sqlite");
	return drizzle(sqliteClient, {
		schema,
		casing: "snake_case",
		logger: process.env.NODE_ENV === "development" ? true : undefined,
	});
};

export type DrizzleDb = Awaited<ReturnType<typeof createDb>>;
