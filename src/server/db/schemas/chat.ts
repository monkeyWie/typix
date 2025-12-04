import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateId, metaFields } from "../util";
import { files } from "./file";

// Chat table - represents conversation sessions
export const chats = sqliteTable("chats", {
	id: text().$defaultFn(generateId).primaryKey(),
	title: text().notNull(),
	userId: text().notNull(),
	provider: text().notNull(), // Current AI provider for the chat
	model: text().notNull(), // Current AI model for the chat
	deleted: integer({ mode: "boolean" }).default(false),
	...metaFields,
});

// Messages table - stores all conversation messages
export const messages = sqliteTable("messages", {
	id: text().$defaultFn(generateId).primaryKey(),
	userId: text().notNull(), // User ID who sent the message
	chatId: text()
		.references(() => chats.id, { onDelete: "cascade" })
		.notNull(),
	content: text().notNull(),
	role: text({ enum: ["user", "assistant"] }).notNull(),
	type: text({ enum: ["text", "image"] })
		.default("text")
		.notNull(),
	// For image messages, this will reference the message generations table
	generationId: text().references(() => messageGenerations.id, {
		onDelete: "set null",
	}),
	metadata: text({ mode: "json" }), // Store additional metadata as JSON
	...metaFields,
});

// Message attachments table - stores attachments for messages
export const messageAttachments = sqliteTable("message_attachments", {
	id: text().$defaultFn(generateId).primaryKey(),
	messageId: text()
		.references(() => messages.id, { onDelete: "cascade" })
		.notNull(),
	fileId: text()
		.references(() => files.id, { onDelete: "cascade" })
		.notNull(),
	type: text({ enum: ["image"] })
		.default("image")
		.notNull(), // Attachment type, currently only image
	...metaFields,
});

const errorReason = ["CONFIG_INVALID", "CONFIG_ERROR", "API_ERROR", "TOO_MANY_REQUESTS", "TIMEOUT", "UNKNOWN"] as const;
export type ErrorReason = (typeof errorReason)[number];

// Generations table - stores AI generation requests and results (images, videos, etc.)
export const messageGenerations = sqliteTable("message_generations", {
	id: text().$defaultFn(generateId).primaryKey(),
	type: text({ enum: ["image", "video"] })
		.default("image")
		.notNull(), // Generation type
	userId: text().notNull(), // User ID who requested the generation
	prompt: text().notNull(), // Original text prompt for generation
	parameters: text({ mode: "json" }), // parameters as JSON
	provider: text().notNull(), // AI provider used for generation
	model: text().notNull(), // AI model used for generation
	status: text({
		enum: ["pending", "generating", "completed", "failed"],
	}).default("pending"),
	fileIds: text({ mode: "json" }), // Array of file IDs if applicable
	errorReason: text({ enum: errorReason }), // Reason for failure if status is "failed"
	generationTime: integer({ mode: "number" }), // Time taken in milliseconds
	cost: real(), // Cost of generation if applicable
	...metaFields,
});

// Define relations between tables
export const chatsRelations = relations(chats, ({ many }) => ({
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id],
	}),
	generation: one(messageGenerations, {
		fields: [messages.generationId],
		references: [messageGenerations.id],
	}),
	attachments: many(messageAttachments),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
	message: one(messages, {
		fields: [messageAttachments.messageId],
		references: [messages.id],
	}),
	file: one(files, {
		fields: [messageAttachments.fileId],
		references: [files.id],
	}),
}));

export const messageGenerationsRelations = relations(messageGenerations, ({ many }) => ({
	messages: many(messages),
}));

export const filesRelations = relations(files, ({ many }) => ({
	messageAttachments: many(messageAttachments),
}));
