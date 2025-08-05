export interface AiModel {
	id: string;
	name: string;
	supportImageEdit: boolean;
	enabledByDefault?: boolean; // Whether this model is enabled by default
}
