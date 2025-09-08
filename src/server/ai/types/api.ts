import type { ErrorReason } from "@/server/db/schemas";
import z from "zod/v4";

// Define supported aspect ratios array
const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
export type AspectRatio = (typeof aspectRatios)[number];

export const commonAspectRatioSizes: Record<AspectRatio, { width: number; height: number }> = {
	"1:1": { width: 1024, height: 1024 },
	"16:9": { width: 1920, height: 1080 },
	"9:16": { width: 1080, height: 1920 },
	"4:3": { width: 1600, height: 1200 },
	"3:4": { width: 1200, height: 1600 },
};

export const TypixGenerateRequestSchema = z.object({
	providerId: z.string(),
	modelId: z.string(),
	prompt: z.string(),
	images: z.array(z.string()).optional(), // Optional images for image generation, Data URI (base64)
	n: z.number().int().min(1).default(1).optional(),
	aspectRatio: z.enum(aspectRatios).optional(), // Optional aspect ratio
});

export type TypixGenerateRequest = z.infer<typeof TypixGenerateRequestSchema>;

export type TypixChatApiResponse = {
	errorReason?: ErrorReason; // Optional error reason if generation failed
	images: string[]; // Array of generated image base64 Data URI
};
