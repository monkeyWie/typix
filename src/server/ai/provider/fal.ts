import { fetchUrlToDataURI } from "@/server/lib/util";
import { ApiError, fal } from "@fal-ai/client";
import type { TypixGenerateRequest } from "../types/api";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import { type ProviderSettingsType, chooseAblility, doParseSettings, findModel } from "../types/provider";

const falSettingsSchema = [
	{
		key: "apiKey",
		type: "password",
		required: true,
	},
] as const satisfies ApiProviderSettingsItem[];

// Automatically generate type from schema
export type FalSettings = ProviderSettingsType<typeof falSettingsSchema>;

const Fal: AiProvider = {
	id: "fal",
	name: "Fal",
	supportCors: true,
	enabledByDefault: true,
	settings: falSettingsSchema,
	models: [
		{
			id: "fal-ai/gemini-25-flash-image",
			name: "Nano Banana",
			ability: "i2i",
			maxInputImages: 4,
			enabledByDefault: true,
		},
		{
			id: "fal-ai/flux-pro/kontext/max",
			name: "FLUX.1 Kontext [max]",
			ability: "i2i",
			enabledByDefault: true,
		},
		{
			id: "fal-ai/flux-pro/kontext",
			name: "FLUX.1 Kontext [pro]",
			ability: "i2i",
			enabledByDefault: true,
		},
		{
			id: "fal-ai/qwen-image",
			name: "Qwen Image",
			ability: "i2i",
			enabledByDefault: true,
		},
	],
	parseSettings: <FalSettings>(settings: ApiProviderSettings) => {
		return doParseSettings(settings, falSettingsSchema) as FalSettings;
	},
	generate: async (request, settings) => {
		try {
			const { apiKey } = Fal.parseSettings<FalSettings>(settings);
			const model = findModel(Fal, request.modelId);

			const genType = chooseAblility(request, model.ability);
			let endpoint = "";
			switch (request.modelId) {
				case "fal-ai/gemini-25-flash-image":
					if (genType === "i2i") {
						endpoint = "/edit";
					}
					break;
				case "fal-ai/qwen-image":
					if (genType === "i2i") {
						endpoint = "-edit";
					}
					break;
				default:
					switch (genType) {
						case "t2i":
							endpoint = "/text-to-image";
							break;
						case "i2i": {
							// Check if this model supports multiple images
							const model = Fal.models.find((m) => m.id === request.modelId);
							const maxImages = model?.maxInputImages || 1;

							if ((request.images?.length || 0) > 1 && maxImages > 1) {
								endpoint = "/multi";
							}
							break;
						}
					}
			}

			fal.config({ credentials: apiKey });

			const input: any = { prompt: request.prompt };

			// Add num_images parameter for multiple image generation
			if (request.n && request.n > 1) {
				input.num_images = request.n;
			}

			if (genType === "i2i") {
				if ((model.maxInputImages || 1) === 1) {
					input.image_url = request.images?.[0];
				} else {
					input.image_urls = request.images;
				}
			}

			const resp = await fal.run(request.modelId + endpoint, { input });

			return {
				images: await Promise.all(
					(resp.data.images || []).map(async (image: { url: string }) => {
						if (image.url) {
							try {
								return await fetchUrlToDataURI(image.url);
							} catch (error) {
								console.error("Fal image fetch error:", error);
								return null;
							}
						}
						return null;
					}),
				).then((results) => results.filter(Boolean) as string[]),
			};
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.status === 401 || error.status === 404) {
					return {
						errorReason: "CONFIG_ERROR",
						images: [],
					};
				}
			}
			throw error;
		}
	},
};

export default Fal;
