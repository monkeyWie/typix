import { getProviderById } from "@/server/ai/provider";
import type { ApiProviderSettings } from "@/server/ai/types/provider";
import { chats, generations, messages } from "@/server/db/schemas";
import { createSchemaOmits } from "@/server/db/util";
import { inBrowser, inCfWorker } from "@/server/lib/env";
import { ServiceException } from "@/server/lib/exception";
import { and, desc, eq, ne } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod/v4";
import { aiService } from "../ai";
import { type RequestContext, getContext } from "../context";
import { getFileData, getFileUrl, saveFiles } from "../file/storage";

export const CreateChatSchema = createInsertSchema(chats)
	.pick({
		title: true,
		provider: true,
		model: true,
	})
	.extend({
		content: z.string().optional(),
		/**
		 * Data URI (base64) images
		 */
		images: z.array(z.string()).optional(),
	});
export type CreateChat = z.infer<typeof CreateChatSchema>;
const createChat = async (req: CreateChat, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const [chat] = await db
		.insert(chats)
		.values({
			userId,
			title: req.title,
			provider: req.provider,
			model: req.model,
		})
		.returning();

	if (req.content) {
		await createMessage(
			{
				chatId: chat!.id,
				content: req.content,
				type: "text",
				provider: req.provider,
				model: req.model,
				images: req.images,
			},
			ctx,
		);
	}

	return { id: chat!.id };
};

const getChats = async (ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const userChats = await db.query.chats.findMany({
		where: and(eq(chats.userId, userId), eq(chats.deleted, false)),
		orderBy: [desc(chats.createdAt)],
	});

	return userChats;
};

export const GetChatByIdSchema = z.object({
	id: z.string(),
});
export type GetChatById = z.infer<typeof GetChatByIdSchema>;
const getChatById = async (req: GetChatById, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const chat = await db.query.chats.findFirst({
		where: and(eq(chats.id, req.id), eq(chats.userId, userId), eq(chats.deleted, false)),
		with: {
			messages: {
				orderBy: [messages.createdAt],
				with: {
					generation: true,
				},
			},
		},
	});

	if (!chat || chat.userId !== userId) {
		return null;
	}

	const chatMessages = await Promise.all(
		chat.messages.map(async (msg) => {
			const fileIds = msg.generation?.fileIds as string[] | null;
			return {
				...msg,
				generation: msg.generation
					? {
							...msg.generation,
							...(fileIds
								? {
										resultUrls: await Promise.all(
											fileIds!.map(async (fileId) => {
												return await getFileUrl(fileId, userId);
											}),
										),
									}
								: null),
						}
					: null,
			};
		}),
	);

	return {
		...chat,
		messages: chatMessages,
	};
};

export const DeleteChatSchema = z.object({
	id: z.string(),
});
export type DeleteChat = z.infer<typeof DeleteChatSchema>;
const deleteChat = async (req: DeleteChat, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const chat = await db.query.chats.findFirst({
		where: eq(chats.id, req.id),
	});

	if (!chat || chat.userId !== userId) {
		return false;
	}

	await getContext().db.update(chats).set({ deleted: true }).where(eq(chats.id, req.id));

	return true;
};

export const UpdateChatSchema = createUpdateSchema(chats)
	.pick({
		id: true,
		provider: true,
		model: true,
		title: true,
	})
	.extend({
		id: z.string().nonempty(),
	});
export type UpdateChat = z.infer<typeof UpdateChatSchema>;
const updateChat = async (req: UpdateChat, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const chat = await db.query.chats.findFirst({
		where: eq(chats.id, req.id),
	});

	if (!chat || chat.userId !== userId) {
		throw new ServiceException("not_found", "Chat not found");
	}

	// Validate provider and model if provided
	if (req.provider && req.model) {
		const providerInstance = getProviderById(req.provider);
		const modelExists = providerInstance.models.some((m) => m.id === req.model);
		if (!modelExists) {
			throw new ServiceException("invalid_parameter", "Model not found for the specified provider");
		}
	}

	await getContext()
		.db.update(chats)
		.set({
			...(req.provider && { provider: req.provider }),
			...(req.model && { model: req.model }),
			...(req.title && { title: req.title }),
			updatedAt: new Date().toISOString(),
		})
		.where(eq(chats.id, req.id));

	return true;
};

export const CreateMessageSchema = createInsertSchema(messages)
	.omit(createSchemaOmits)
	.pick({
		chatId: true,
		content: true,
		type: true,
	})
	.extend({
		provider: z.string(),
		model: z.string(),
		/**
		 * base64-encoded image strings
		 */
		images: z.array(z.string()).optional(),
	});
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
type CreateMessageResponse = Pick<NonNullable<Awaited<ReturnType<typeof getChatById>>>, "messages">;
const createMessage = async (req: CreateMessage, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	// Verify chat exists and belongs to user
	const chat = await db.query.chats.findFirst({
		where: eq(chats.id, req.chatId),
	});
	if (!chat || chat.userId !== userId) {
		throw new ServiceException("not_found", "Chat not found");
	}

	// Add user message
	const [userMessage] = await db
		.insert(messages)
		.values({
			userId: userId,
			chatId: req.chatId,
			content: req.content,
			role: "user",
			type: req.type,
		})
		.returning();

	if (!userMessage) {
		throw new ServiceException("error", "Failed to create user message");
	}

	// Update chat timestamp
	await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, req.chatId));

	// Create generation record
	const [generation] = await db
		.insert(generations)
		.values({
			userId: userId,
			prompt: req.content,
			provider: req.provider,
			model: req.model,
			type: "image",
			status: "pending",
		})
		.returning();

	// Add assistant message
	const [assistantMessage] = await db
		.insert(messages)
		.values({
			userId: userId,
			chatId: req.chatId,
			content: "",
			role: "assistant",
			type: "image",
			generationId: generation!.id,
		})
		.returning();
	if (!assistantMessage) {
		throw new ServiceException("error", "Failed to create assistant message");
	}

	// Generate image using AI provider asynchronously
	const generateImage = async () => {
		try {
			const providerInstance = getProviderById(req.provider);
			const provider = await aiService.getAiProviderById({ providerId: req.provider }, ctx);
			const settings =
				provider?.settings?.reduce((acc, setting) => {
					const value = setting.value ?? setting.defaultValue;
					if (value !== undefined) {
						acc[setting.key] = value;
					}
					return acc;
				}, {} as ApiProviderSettings) ?? {};

			const model = providerInstance.models.find((m) => m.id === req.model);
			let referImages: string[] | undefined;

			// Always use user uploaded images if provided
			if (req.images && req.images.length > 0) {
				referImages = req.images;
			} else if (model?.ability !== "t2i") {
				// If no user images and model supports image edit, refer to last message's images
				const lastMessageImage = async () => {
					const lastMessage = await db.query.messages.findFirst({
						where: and(
							eq(messages.chatId, req.chatId),
							ne(messages.id, assistantMessage.id),
							eq(messages.role, "assistant"),
							eq(messages.type, "image"),
						),
						orderBy: [desc(messages.createdAt)],
						with: {
							generation: {
								columns: {
									fileIds: true,
								},
							},
						},
					});
					const fileIds = lastMessage?.generation?.fileIds as string[] | null;
					if (fileIds && fileIds.length > 0) {
						switch (model?.ability) {
							case "i2i":
								// For single image edit, use the last image
								return [await getFileData(fileIds[fileIds.length - 1]!, userId)].filter(Boolean) as string[];
							case "mi2i":
								// For multi image edit, use all images
								return (await Promise.all(fileIds.map((id) => getFileData(id, userId)))).filter(Boolean) as string[];
						}
					}
				};

				referImages = await lastMessageImage();
			}

			const result = await providerInstance.generate(
				{
					providerId: req.provider,
					modelId: req.model,
					prompt: req.content,
					images: referImages,
				},
				settings,
			);
			if (!result || !result.images || result.images.length === 0) {
				await db
					.update(generations)
					.set({
						status: "failed",
						errorMessage: "AI provider did not return any images",
					})
					.where(eq(generations.id, generation!.id));
				return;
			}

			const now = new Date();
			// Save generated files to database
			const fileIds = await saveFiles(result.images, userId);
			// Update generation with result URLs
			await db
				.update(generations)
				.set({
					status: "completed",
					fileIds,
					generationTime: Date.now() - now.getTime(),
					updatedAt: now.toISOString(),
				})
				.where(eq(generations.id, generation!.id));
		} catch (error) {
			console.error("Error generating image:", error);
			await db
				.update(generations)
				.set({
					status: "failed",
					errorMessage: error instanceof Error ? error.message : "Unknown error",
				})
				.where(eq(generations.id, generation!.id));
			return;
		}
	};
	if (!inBrowser && inCfWorker) {
		// Run generation in background for Cloudflare Workers
		ctx.executionCtx!.waitUntil(generateImage());
	} else {
		generateImage();
	}

	return {
		messages: [
			{ ...userMessage, generation: null },
			{ ...assistantMessage, generation: generation! },
		],
	} satisfies CreateMessageResponse;
};

export const GetGenerationStatusSchema = z.object({
	generationId: z.string(),
});
export type GetGenerationStatus = z.infer<typeof GetGenerationStatusSchema>;
const getGenerationStatus = async (req: GetGenerationStatus, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	const generation = await db.query.generations.findFirst({
		where: eq(generations.id, req.generationId),
	});

	if (!generation || generation.userId !== userId) {
		return null;
	}

	return {
		...generation,
		resultUrls: generation.fileIds
			? await Promise.all(
					(generation.fileIds as string[]).map(async (fileId) => {
						return await getFileUrl(fileId, userId);
					}),
				)
			: undefined,
	};
};

class ChatService {
	createChat = createChat;
	getChats = getChats;
	getChatById = getChatById;
	deleteChat = deleteChat;
	updateChat = updateChat;
	createMessage = createMessage;
	getGenerationStatus = getGenerationStatus;
}

export const chatService = new ChatService();
