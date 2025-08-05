import { sql } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";
import { customAlphabet } from "nanoid/non-secure";

export const generateId = () => customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 16)();

export const metaFields = {
	createdAt: text().default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: text().default(sql`CURRENT_TIMESTAMP`).notNull(),
};

export const createSchemaOmits = {
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
} as const;
