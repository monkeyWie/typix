import { AI_PROVIDERS, getProviderById } from "@/server/ai/provider";
import type { ApiProviderSettings } from "@/server/ai/types/provider";
import { getProviderSettingsSchema } from "@/server/ai/types/provider";
import { aiModels, aiProviders } from "@/server/db/schemas";
import { ServiceException } from "@/server/lib/exception";
import { and, eq, inArray } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod/v4";
import { type RequestContext, getContext } from "../context";

const getAiProviders = async (ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	// Get user providers from database
	const userAiProviders = await db.query.aiProviders.findMany({
		where: eq(aiProviders.userId, userId),
	});
	const userAiProviderMap = userAiProviders.reduce(
		(acc, provider) => {
			acc[provider.providerId] = provider;
			return acc;
		},
		{} as Record<string, (typeof userAiProviders)[0]>,
	);

	// Combine system providers with user providers
	const combineAiProviders = AI_PROVIDERS.map((provider) => ({
		...provider,
		enabled: userAiProviderMap[provider.id]?.enabled ?? provider.enabledByDefault ?? false,
	}));

	return combineAiProviders;
};

const getEnabledAiProvidersWithModels = async (ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const providers = (await getAiProviders(ctx)).filter((provider) => provider.enabled);
	if (providers.length === 0) {
		return [];
	}

	const userAiModels = await db.query.aiModels.findMany({
		where: and(
			eq(aiModels.userId, userId),
			eq(aiModels.enabled, true),
			inArray(
				aiModels.providerId,
				providers.map((p) => p.id),
			),
		),
	});

	return providers
		.map((provider) => {
			const userProviderModels = userAiModels.filter((m) => m.providerId === provider.id);
			const combineAiModels = provider.models
				.map((model) => {
					const userModel = userProviderModels.find((m) => m.modelId === model.id);
					return {
						...model,
						enabled: userModel?.enabled ?? model.enabledByDefault ?? false,
					};
				})
				.filter((model) => model.enabled);
			return {
				...provider,
				models: combineAiModels,
			};
		})
		.filter((provider) => provider.models.length > 0);
};

export const GetAiProviderByIdSchema = z.object({
	providerId: z.string(),
});
export type GetAiProviderById = z.infer<typeof GetAiProviderByIdSchema>;
const getAiProviderById = async (req: GetAiProviderById, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const providerInstance = getProviderById(req.providerId);

	// Get user provider from database
	const userProvider = await db.query.aiProviders.findFirst({
		where: and(eq(aiProviders.userId, userId), eq(aiProviders.providerId, req.providerId)),
	});

	// Merge user provider with system provider
	const userProviderSettings = userProvider?.settings as ApiProviderSettings | undefined;

	// Get settings schema (handle both direct array and function)
	const settingsSchema = getProviderSettingsSchema(providerInstance);

	const settings = settingsSchema?.map((setting) => {
		const value = userProviderSettings?.[setting.key] ?? setting.defaultValue;
		return {
			...setting,
			value,
		};
	});
	const provider = {
		...providerInstance,
		settings: settings,
		enabled: userProvider?.enabled ?? providerInstance.enabledByDefault ?? false,
	};

	return provider;
};

export const UpdateAiProviderSchema = createUpdateSchema(aiProviders).pick({
	providerId: true,
	enabled: true,
	settings: true,
});
export type UpdateAiProvider = z.infer<typeof UpdateAiProviderSchema>;
const updateAiProvider = async (req: UpdateAiProvider, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	if (!req.providerId) {
		throw new ServiceException("invalid_parameter", "Provider ID is required");
	}

	const providerInstance = getProviderById(req.providerId);

	// Validate settings
	if (req.settings) {
		providerInstance.parseSettings(req.settings);
	}

	// insert or update in database
	const existingProvider = await db.query.aiProviders.findFirst({
		where: and(eq(aiProviders.providerId, req.providerId), eq(aiProviders.userId, userId)),
	});
	if (!existingProvider) {
		// Insert new provider
		await db.insert(aiProviders).values({
			providerId: providerInstance.id,
			userId: userId,
			settings: req.settings,
		});
		return;
	}

	// Update provider in database
	await db
		.update(aiProviders)
		.set({
			enabled: req.enabled,
			settings: req.settings,
		})
		.where(eq(aiProviders.id, existingProvider.id));

	return;
};

export const GetAiModelsByProviderIdSchema = z.object({
	providerId: z.string(),
});
export type GetAiModelsByProviderId = z.infer<typeof GetAiModelsByProviderIdSchema>;
const getAiModelsByProviderId = async (req: GetAiModelsByProviderId, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const providerInstance = getProviderById(req.providerId);
	const models = await db.query.aiModels.findMany({
		where: and(eq(aiModels.providerId, providerInstance.id), eq(aiModels.userId, userId)),
	});

	return providerInstance.models.map((model) => {
		const userModel = models.find((m) => m.modelId === model.id);
		return {
			...model,
			enabled: userModel?.enabled ?? model.enabledByDefault ?? false,
		};
	});
};

export const UpdateAiModelSchema = createInsertSchema(aiModels).pick({
	providerId: true,
	modelId: true,
	enabled: true,
});
export type UpdateAiModel = z.infer<typeof UpdateAiModelSchema>;
const updateAiModel = async (req: UpdateAiModel, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const providerInstance = getProviderById(req.providerId);

	// Validate model
	const model = providerInstance.models.find((m) => m.id === req.modelId);
	if (!model) {
		throw new ServiceException("not_found", "AI model not found in provider");
	}

	// Insert or update in database
	const existingModel = await db.query.aiModels.findFirst({
		where: and(
			eq(aiModels.providerId, providerInstance.id),
			eq(aiModels.modelId, req.modelId),
			eq(aiModels.userId, userId),
		),
	});
	if (!existingModel) {
		// Insert new model
		await db.insert(aiModels).values({
			providerId: providerInstance.id,
			modelId: req.modelId,
			userId: userId,
			enabled: req.enabled,
		});
		return;
	}

	// Update model in database
	await db
		.update(aiModels)
		.set({
			enabled: req.enabled,
		})
		.where(eq(aiModels.id, existingModel.id));

	return;
};

class AiService {
	getAiProviders = getAiProviders;
	getAiProviderById = getAiProviderById;
	getEnabledAiProvidersWithModels = getEnabledAiProvidersWithModels;
	updateAiProvider = updateAiProvider;
	getAiModelsByProviderId = getAiModelsByProviderId;
	updateAiModel = updateAiModel;
}

export const aiService = new AiService();
