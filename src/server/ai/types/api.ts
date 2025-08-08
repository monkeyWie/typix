import type { ErrorReason } from "@/server/db/schemas";
import z from "zod/v4";

export const TypixGenerateRequestSchema = z.object({
	providerId: z.string(),
	modelId: z.string(),
	n: z.number().int().min(1).default(1).optional(),
	images: z.array(z.string()).optional(), // Optional images for image generation, Data URI (base64)
	prompt: z.string(),
});

export type TypixGenerateRequest = z.infer<typeof TypixGenerateRequestSchema>;

export type TypixChatApiResponse = {
	errorReason?: ErrorReason; // Optional error reason if generation failed
	images: string[]; // Array of generated image base64 Data URI
};
