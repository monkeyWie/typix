import { settings } from "@/server/db/schemas";
import { createSchemaOmits } from "@/server/db/util";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import type z from "zod/v4";
import { type RequestContext, getContext } from "../context";

export const UpdateSettingsSchema = createInsertSchema(settings).omit(createSchemaOmits);
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
const updateSettings = async (req: UpdateSettings, ctx: RequestContext) => {
	const { theme, themeColor, language } = req;
	const { db } = getContext();
	const { userId } = ctx;

	// Check if settings exist
	const existingSettings = await db.query.settings.findFirst({
		where: eq(settings.userId, userId),
	});

	if (existingSettings) {
		// Update existing settings
		await db
			.update(settings)
			.set({
				...(theme && { theme }),
				...(themeColor && { themeColor }),
				...(language && { language }),
			})
			.where(eq(settings.userId, userId));
	} else {
		// Insert new settings
		await db.insert(settings).values({
			userId: userId,
			theme: theme || "system",
			themeColor: themeColor || "default",
			language: language || "system",
		});
	}
};

const getSettings = async (ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	return await db.query.settings.findFirst({
		where: eq(settings.userId, userId),
	});
};

class SettingsService {
	updateSettings = updateSettings;
	getSettings = getSettings;
}

export const settingsService = new SettingsService();
