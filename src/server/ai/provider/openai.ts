import { fetchUrlToBase64 } from "@/server/lib/util";
import openai from "openai";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import { type ProviderSettingsType, doParseSettings } from "../types/provider";

// Convert base64 string to FsReadStream compatible format
function createImageStreamFromBase64(base64: string) {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	const stream = {
		path: "image.png",
		async *[Symbol.asyncIterator]() {
			yield bytes;
		},
	};

	return stream;
}

const openAISettingsSchema = [
	{
		key: "apiKey",
		type: "password",
		required: true,
	},
	{
		key: "baseURL",
		type: "url",
		required: false,
		defaultValue: "https://api.openai.com/v1",
	},
	{
		key: "model",
		type: "string",
		required: false,
		defaultValue: "gpt-image-1",
	},
] as const satisfies ApiProviderSettingsItem[];

// Automatically generate type from schema
export type OpenAISettings = ProviderSettingsType<typeof openAISettingsSchema>;

const OpenAI: AiProvider = {
	id: "openai",
	name: "OpenAI",
	supportCors: true,
	enabledByDefault: true,
	settings: openAISettingsSchema,
	models: [
		{
			id: "gpt-image-1",
			name: "GPT Image 1",
			supportImageEdit: true,
			enabledByDefault: true,
		},
	],
	parseSettings: <OpenAISettings>(settings: ApiProviderSettings) => {
		return doParseSettings(settings, openAISettingsSchema) as OpenAISettings;
	},
	generate: async (request, settings) => {
		const { baseURL, apiKey } = OpenAI.parseSettings<OpenAISettings>(settings);

		const client = new openai.OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

		let generateResult: openai.ImagesResponse;
		if (!request.images || request.images.length === 0) {
			// Text-to-image generation
			generateResult = await client.images.generate({
				model: request.modelId,
				prompt: request.prompt,
				n: request.n || 1,
			});
		} else {
			// Image editing
			generateResult = await client.images.edit({
				model: request.modelId,
				image: request.images.map(createImageStreamFromBase64),
				prompt: request.prompt,
				n: request.n || 1,
			});
		}

		return {
			images: await Promise.all(
				(generateResult.data || []).map(async (image) => {
					if (image.b64_json) {
						return image.b64_json;
					}
					if (image.url) {
						try {
							return await fetchUrlToBase64(image.url);
						} catch (error) {
							console.error("OpenAI image fetch error:", error);
							return null;
						}
					}
					return undefined;
				}),
			).then((results) => results.filter(Boolean) as string[]),
		};
	},
};

export default OpenAI;
