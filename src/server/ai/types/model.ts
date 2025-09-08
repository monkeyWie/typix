import type { AspectRatio } from "./api";

export type Ability = "t2i" | "i2i";

export interface AiModel {
	id: string;
	name: string;
	ability: Ability; // Model image generation ability
	maxInputImages?: number; // Maximum number of input images for i2i models, default is 1
	enabledByDefault?: boolean; // Whether this model is enabled by default
	supportedAspectRatios?: AspectRatio[]; // Supported aspect ratios for the model
}
