import { ServiceException } from "@/server/lib/exception";
import { fetchUrlToDataURI } from "@/server/lib/util";
import { fal } from "@fal-ai/client";
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
			id: "fal-ai/flux-pro/kontext/max",
			name: "FLUX.1 Kontext [max]",
			ability: "mi2i",
			enabledByDefault: true,
		},
		{
			id: "fal-ai/flux-pro/kontext",
			name: "FLUX.1 Kontext [pro]",
			ability: "i2i",
			enabledByDefault: true,
		},
	],
	parseSettings: <FalSettings>(settings: ApiProviderSettings) => {
		return doParseSettings(settings, falSettingsSchema) as FalSettings;
	},
	generate: async (request, settings) => {
		const { apiKey } = Fal.parseSettings<FalSettings>(settings);

		const genType = chooseAblility(request, findModel(Fal, request.modelId).ability);
		let endpoint: string;
		switch (genType) {
			case "t2i":
				endpoint = "/text-to-image";
				break;
			case "i2i":
				endpoint = "";
				break;
			case "mi2i":
				endpoint = "/multi";
				break;
		}

		fal.config({ credentials: apiKey });
		const resp = await fal.run(request.modelId + endpoint, {
			input: {
				prompt: request.prompt,
				image_url: genType === "i2i" ? request.images?.[0] : undefined,
				image_urls: genType === "mi2i" ? request.images : undefined,
			},
		});

		console.log("Fal response:", resp);

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
	},
};

export default Fal;
