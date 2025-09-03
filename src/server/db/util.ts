import { text } from "drizzle-orm/sqlite-core";
import { customAlphabet } from "nanoid/non-secure";

export const generateId = () => customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 16)();

export const metaFields = {
	createdAt: text()
		.$defaultFn(() => new Date().toISOString())
		.notNull(),
	updatedAt: text()
		.$defaultFn(() => new Date().toISOString())
		.notNull(),
};

export const createSchemaOmits = {
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
} as const;
