import { getProviderById } from "@/server/ai/provider";
import { type ApiProviderSettings, ConfigInvalidError } from "@/server/ai/types/provider";
import { chats, messageAttachments, messageGenerations, messages } from "@/server/db/schemas";
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
		 * Number of images to generate
		 */
		imageCount: z.number().int().min(1).max(10).default(1),
		/**
		 * Aspect ratio for image generation
		 */
		aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
		/**
		 * Attachments for the first message
		 */
		attachments: z
			.array(
				z.object({
					data: z.string(), // base64 data
					type: z.enum(["image"]).default("image"),
				}),
			)
			.optional(),
		/**
		 * @deprecated Use attachments instead
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
				imageCount: req.imageCount, // Pass the image count
				aspectRatio: req.aspectRatio, // Pass the aspect ratio
				attachments: req.attachments,
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
					attachments: {
						with: {
							file: true,
						},
					},
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

			// Process attachments for user messages
			const attachmentUrls = msg.attachments
				? await Promise.all(
						msg.attachments.map(async (attachment) => ({
							id: attachment.id,
							type: attachment.type,
							url: await getFileUrl(attachment.fileId, userId),
						})),
					)
				: [];

			return {
				...msg,
				attachments: attachmentUrls,
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
		})
		.where(eq(chats.id, req.id));

	return true;
};

export const DeleteMessageSchema = z.object({
	messageId: z.string().nonempty(),
});
export type DeleteMessage = z.infer<typeof DeleteMessageSchema>;
const deleteMessage = async (req: DeleteMessage, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	// Find the message and verify ownership
	const message = await db.query.messages.findFirst({
		where: eq(messages.id, req.messageId),
		with: {
			chat: true,
			generation: true,
			attachments: true, // Include attachments for cleanup
		},
	});

	if (!message || message.chat.userId !== userId) {
		throw new ServiceException("not_found", "Message not found");
	}

	// Delete message attachments (this should cascade delete via foreign key constraints)
	if (message.attachments && message.attachments.length > 0) {
		await db.delete(messageAttachments).where(eq(messageAttachments.messageId, req.messageId));
	}

	// Delete the message (this should cascade delete associated generation via foreign key constraint)
	await db.delete(messages).where(eq(messages.id, req.messageId));

	// Update chat timestamp
	await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, message.chatId));

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
		 * Number of images to generate
		 */
		imageCount: z.number().int().min(1).max(10).default(1),
		/**
		 * Aspect ratio for image generation
		 */
		aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
		/**
		 * base64-encoded image strings for attachments
		 */
		attachments: z
			.array(
				z.object({
					data: z.string(), // base64 data
					type: z.enum(["image"]).default("image"),
				}),
			)
			.optional(),
		/**
		 * @deprecated Use attachments instead
		 * base64-encoded image strings
		 */
		images: z.array(z.string()).optional(),
	});
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
type CreateMessageResponse = Pick<NonNullable<Awaited<ReturnType<typeof getChatById>>>, "messages">;

// Common image generation logic
interface GenerationParams {
	generationId: string;
	prompt: string;
	provider: string;
	model: string;
	chatId: string;
	userId: string;
	userImages?: string[];
	imageCount?: number; // Number of images to generate
	aspectRatio?: string; // Aspect ratio for image generation
	messageId?: string; // For regeneration, exclude this message from reference search
}

const executeImageGeneration = async (params: GenerationParams, ctx: RequestContext) => {
	const { db } = getContext();
	const {
		generationId,
		prompt,
		provider: providerId,
		model: modelId,
		chatId,
		userId,
		userImages,
		imageCount,
		aspectRatio,
		messageId,
	} = params;

	try {
		const providerInstance = getProviderById(providerId);
		const provider = await aiService.getAiProviderById({ providerId }, ctx);
		const settings =
			provider?.settings?.reduce((acc, setting) => {
				const value = setting.value ?? setting.defaultValue;
				if (value !== undefined) {
					acc[setting.key] = value;
				}
				return acc;
			}, {} as ApiProviderSettings) ?? {};

		const model = providerInstance.models.find((m) => m.id === modelId);
		let referImages: string[] | undefined;

		// Always use user uploaded images if provided
		if (userImages && userImages.length > 0) {
			referImages = userImages;
		} else if (model?.ability !== "t2i") {
			// If no user images and model supports image edit, refer to last message's images
			const lastMessageImage = async () => {
				const whereConditions = [
					eq(messages.chatId, chatId),
					eq(messages.role, "assistant"),
					eq(messages.type, "image"),
				];

				// Exclude the current message being regenerated
				if (messageId) {
					whereConditions.push(ne(messages.id, messageId));
				}

				const lastMessage = await db.query.messages.findFirst({
					where: and(...whereConditions),
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
						case "i2i": {
							// For i2i models, use appropriate number of images based on maxInputImages
							const maxImages = model.maxInputImages || 1;
							if (maxImages === 1) {
								// For single image edit, use the last image
								return [await getFileData(fileIds[fileIds.length - 1]!, userId)].filter(Boolean) as string[];
							}
							// For multi image edit, use all images up to the limit
							const imagesToUse = fileIds.slice(-maxImages);
							return (await Promise.all(imagesToUse.map((id) => getFileData(id, userId)))).filter(Boolean) as string[];
						}
					}
				}
			};

			referImages = await lastMessageImage();
		}

		const result = await providerInstance.generate(
			{
				providerId,
				modelId,
				prompt,
				images: referImages,
				n: imageCount || 1, // Pass the image count to provider
				aspectRatio: aspectRatio as any, // Pass the aspect ratio to provider
			},
			settings,
		);
		if (result.errorReason) {
			await db
				.update(messageGenerations)
				.set({
					status: "failed",
					errorReason: result.errorReason,
				})
				.where(eq(messageGenerations.id, generationId));
			return;
		}

		const now = new Date();
		// Save generated files to database
		const fileIds = await saveFiles(result.images, userId);
		// Update generation with result URLs
		await db
			.update(messageGenerations)
			.set({
				status: "completed",
				fileIds,
				generationTime: Date.now() - now.getTime(),
				updatedAt: now.toISOString(),
			})
			.where(eq(messageGenerations.id, generationId));
	} catch (error) {
		console.error("Error generating image:", error);
		await db
			.update(messageGenerations)
			.set({
				status: "failed",
				errorReason: error instanceof ConfigInvalidError ? "CONFIG_INVALID" : "UNKNOWN",
			})
			.where(eq(messageGenerations.id, generationId));
		return;
	}
};

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

	// Handle attachments if provided
	const attachmentResults: Array<{ id: string; type: "image"; url: string | null }> = [];
	if (req.attachments && req.attachments.length > 0) {
		// Save attachment files
		const attachmentFileIds = await saveFiles(
			req.attachments.map((att) => att.data),
			userId,
		);

		// Create attachment records and prepare results
		for (let i = 0; i < req.attachments.length; i++) {
			const attachment = req.attachments[i];
			const fileId = attachmentFileIds[i];
			if (fileId && attachment) {
				await db.insert(messageAttachments).values({
					messageId: userMessage.id,
					fileId: fileId,
					type: attachment.type,
				});

				// Prepare attachment result for response
				const fileUrl = await getFileUrl(fileId, userId);
				attachmentResults.push({
					id: `${userMessage.id}-${i}`,
					type: "image",
					url: fileUrl,
				});
			}
		}
	}

	// Update chat timestamp
	await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, req.chatId));

	// Create generation record
	const [generation] = await db
		.insert(messageGenerations)
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

	// Execute image generation using common logic
	// Use attachments data or fallback to legacy images param
	const userImages = req.attachments?.map((att) => att.data) || req.images;

	const generateImage = () =>
		executeImageGeneration(
			{
				generationId: generation!.id,
				prompt: req.content,
				provider: req.provider,
				model: req.model,
				chatId: req.chatId,
				userId,
				userImages,
				imageCount: req.imageCount, // Pass the image count
				aspectRatio: req.aspectRatio, // Pass the aspect ratio
				messageId: assistantMessage.id,
			},
			ctx,
		);

	if (!inBrowser && inCfWorker) {
		// Run generation in background for Cloudflare Workers
		ctx.executionCtx!.waitUntil(generateImage());
	} else {
		generateImage();
	}

	return {
		messages: [
			{
				...userMessage,
				generation: null,
				// Include attachments for immediate display
				attachments: attachmentResults,
			},
			{ ...assistantMessage, generation: generation!, attachments: [] },
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

	const generation = await db.query.messageGenerations.findFirst({
		where: eq(messageGenerations.id, req.generationId),
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

export const RegenerateMessageSchema = z.object({
	messageId: z.string(),
});
export type RegenerateMessage = z.infer<typeof RegenerateMessageSchema>;
const regenerateMessage = async (req: RegenerateMessage, ctx: RequestContext) => {
	const { db } = getContext();
	const { userId } = ctx;

	// Find the message to regenerate
	const message = await db.query.messages.findFirst({
		where: eq(messages.id, req.messageId),
		with: {
			generation: true,
			chat: true,
		},
	});

	if (!message || message.userId !== userId || message.role !== "assistant") {
		throw new ServiceException("not_found", "Message not found or not regeneratable");
	}

	if (!message.generation) {
		throw new ServiceException("invalid_parameter", "Message has no generation to regenerate");
	}

	const originalGeneration = message.generation;
	const chat = message.chat;

	if (!chat) {
		throw new ServiceException("not_found", "Chat not found");
	}

	// Reset the existing generation record to pending status
	await db
		.update(messageGenerations)
		.set({
			status: "pending",
			fileIds: null, // Clear previous results
			errorReason: null, // Clear previous errors
			generationTime: null, // Clear previous timing
			updatedAt: new Date().toISOString(),
		})
		.where(eq(messageGenerations.id, originalGeneration.id));

	// Reset message content while regenerating
	await db
		.update(messages)
		.set({
			content: "", // Reset content while regenerating
		})
		.where(eq(messages.id, req.messageId));

	// Update chat timestamp
	await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, chat.id));

	// Execute image generation using common logic
	const generateImage = () =>
		executeImageGeneration(
			{
				generationId: originalGeneration.id, // Use existing generation ID
				prompt: originalGeneration.prompt,
				provider: originalGeneration.provider,
				model: originalGeneration.model,
				chatId: chat.id,
				userId,
				// For regeneration, we can infer imageCount from existing fileIds count
				// or fallback to 1 if no previous results
				imageCount: Array.isArray(originalGeneration.fileIds) ? originalGeneration.fileIds.length : 1,
				messageId: req.messageId, // Exclude this message from reference search
			},
			ctx,
		);

	if (!inBrowser && inCfWorker) {
		// Run generation in background for Cloudflare Workers
		ctx.executionCtx!.waitUntil(generateImage());
	} else {
		generateImage();
	}

	return {
		messageId: req.messageId,
		generationId: originalGeneration.id, // Return the existing generation ID
	};
};

class ChatService {
	createChat = createChat;
	getChats = getChats;
	getChatById = getChatById;
	deleteChat = deleteChat;
	updateChat = updateChat;
	createMessage = createMessage;
	deleteMessage = deleteMessage;
	getGenerationStatus = getGenerationStatus;
	regenerateMessage = regenerateMessage;
}

export const chatService = new ChatService();
