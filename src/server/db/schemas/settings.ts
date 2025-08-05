import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateId, metaFields } from "../util";
import { user } from "./auth";

const theme = ["system", "light", "dark"] as const;
export type Theme = (typeof theme)[number];

const themeColor = ["default", "red", "rose", "orange", "green", "blue", "yellow", "violet"] as const;
export type ThemeColor = (typeof themeColor)[number];

// User settings table - stores user UI and app settings
export const settings = sqliteTable("settings", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" })
		.unique(),
	theme: text({ enum: theme }).default("system"),
	themeColor: text({ enum: themeColor }).default("default"),
	language: text().default("system"),
	...metaFields,
});
