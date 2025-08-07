export type Ability = "t2i" | "i2i" | "mi2i";

export interface AiModel {
	id: string;
	name: string;
	ability: Ability; // Model image generation ability
	enabledByDefault?: boolean; // Whether this model is enabled by default
}
