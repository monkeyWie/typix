import { type Client, createClient } from "@libsql/client";
/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	client: Client | undefined;
};

export const client = globalForDb.client ?? createClient({ url: process.env.DATABASE_URL! });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;
