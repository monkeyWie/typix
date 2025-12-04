import { inCfWorker } from "@/server/lib/env";
import type { ReplacePropertyType } from "@/server/lib/types";
import { base64ToBlob, base64ToDataURI, dataURItoBase64, readableStreamToDataURI } from "@/server/lib/util";
import { getContext } from "@/server/service/context";
import { type TypixGenerateRequest, commonAspectRatioSizes } from "../types/api";
import type { AiModel } from "../types/model";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import {
	type ProviderSettingsType,
	chooseAblility,
	doParseSettings,
	findModel,
	getProviderSettingsSchema,
} from "../types/provider";

// Helper function to create FormData from params
const createFormData = (params: any, model: CloudflareAiModel, request: TypixGenerateRequest): FormData => {
	const form = new FormData();
	form.append("prompt", params.prompt);
	if (params.width) form.append("width", String(params.width));
	if (params.height) form.append("height", String(params.height));

	// Handle image editing (i2i) with multiple input images
	if (request.images) {
		const maxInputImages = model.maxInputImages || 1;
		const images = request.images;

		// Append images with numbered parameter names
		for (let i = 0; i < Math.min(images.length, maxInputImages); i++) {
			const imageBlob = base64ToBlob(dataURItoBase64(images[i]!));
			form.append(`input_image_${i}`, imageBlob);
		}
	}

	return form;
};

// Helper function to handle API response
const handleApiResponse = async (resp: Response): Promise<string[]> => {
	if (!resp.ok) {
		if (resp.status === 401 || resp.status === 404) {
			throw new Error("CONFIG_ERROR");
		}
		if (resp.status === 429) {
			throw new Error("TOO_MANY_REQUESTS");
		}
		const errorText = await resp.text();
		throw new Error(`Cloudflare API error: ${resp.status} ${resp.statusText} - ${errorText}`);
	}

	const contentType = resp.headers.get("Content-Type");
	if (contentType?.includes("image/png") === true) {
		const imageBuffer = await resp.arrayBuffer();
		return [base64ToDataURI(Buffer.from(imageBuffer).toString("base64"))];
	}

	const result = (await resp.json()) as unknown as any;
	return [base64ToDataURI(result.result.image)];
};

// Single image generation helper function
const generateSingle = async (request: TypixGenerateRequest, settings: ApiProviderSettings): Promise<string[]> => {
	const AI = getContext().AI;
	const { builtin, apiKey, accountId } = Cloudflare.parseSettings<CloudflareSettings>(settings);

	const model = findModel(Cloudflare, request.modelId) as CloudflareAiModel;
	const genType = chooseAblility(request, model.ability);
	const inputType = model.inputType || "JSON";

	const params = {
		prompt: request.prompt,
	} as any;
	if (request.aspectRatio) {
		const size = commonAspectRatioSizes[request.aspectRatio];
		params.width = size?.width;
		params.height = size?.height;
	}
	if (genType === "i2i") {
		params.image_b64 = dataURItoBase64(request.images![0]!);
	}

	// Built-in Cloudflare Worker AI
	if (inCfWorker && AI && builtin === true) {
		if (inputType === "FormData") {
			const form = createFormData(params, model, request);
			const formRequest = new Request("http://dummy", {
				method: "POST",
				body: form,
			});

			const resp = await AI.run(request.modelId as unknown as any, {
				multipart: {
					body: formRequest.body,
					contentType: formRequest.headers.get("content-type") || "multipart/form-data",
				},
			});

			if (resp instanceof ReadableStream) {
				return [await readableStreamToDataURI(resp)];
			}
			return [base64ToDataURI(resp.image)];
		}

		// Default JSON format
		const resp = await AI.run(request.modelId as unknown as any, params);
		if (resp instanceof ReadableStream) {
			return [await readableStreamToDataURI(resp)];
		}
		return [base64ToDataURI(resp.image)];
	}

	// External API call
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${request.modelId}`;
	const headers = { Authorization: `Bearer ${apiKey}` };

	if (inputType === "FormData") {
		const resp = await fetch(url, {
			method: "POST",
			headers,
			body: createFormData(params, model, request),
		});
		return handleApiResponse(resp);
	}

	// Default JSON format
	const resp = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(params),
	});
	return handleApiResponse(resp);
};

const cloudflareSettingsNotBuiltInSchema = [
	{
		key: "accountId",
		type: "password",
		required: true,
	},
	{
		key: "apiKey",
		type: "password",
		required: true,
	},
] as const satisfies ApiProviderSettingsItem[];
const cloudflareSettingsBuiltinSchema = [
	{
		key: "builtin",
		type: "boolean",
		required: true,
		defaultValue: true,
	},
	{
		key: "accountId",
		type: "password",
		required: false,
	},
	{
		key: "apiKey",
		type: "password",
		required: false,
	},
] as const satisfies ApiProviderSettingsItem[];

// Automatically generate type from schema
export type CloudflareSettings = ProviderSettingsType<typeof cloudflareSettingsBuiltinSchema>;

type CloudflareAiModel = AiModel & {
	inputType?: "JSON" | "FormData";
};

type CloudflareProvider = ReplacePropertyType<AiProvider, "models", CloudflareAiModel[]>;

const Cloudflare: CloudflareProvider = {
	id: "cloudflare",
	name: "Cloudflare AI",
	settings: () => {
		return inCfWorker && getContext().providerCloudflareBuiltin === true
			? cloudflareSettingsBuiltinSchema
			: cloudflareSettingsNotBuiltInSchema;
	},
	enabledByDefault: true,
	models: [
		{
			id: "@cf/black-forest-labs/flux-2-dev",
			name: "FLUX.2-dev",
			ability: "i2i",
			maxInputImages: 4,
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
			inputType: "FormData",
		},
		{
			id: "@cf/leonardo/lucid-origin",
			name: "Lucid Origin",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "@cf/black-forest-labs/flux-1-schnell",
			name: "FLUX.1-schnell",
			ability: "t2i",
			enabledByDefault: true,
		},
		{
			id: "@cf/lykon/dreamshaper-8-lcm",
			name: "DreamShaper 8 LCM",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "@cf/bytedance/stable-diffusion-xl-lightning",
			name: "Stable Diffusion XL Lightning",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		// {
		// 	id: "@cf/runwayml/stable-diffusion-v1-5-img2img",
		// 	name: "Stable Diffusion v1.5 Img2Img",
		// 	ability: "i2i",
		// 	enabledByDefault: true,
		// },
		{
			id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
			name: "Stable Diffusion XL Base 1.0",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
	],
	parseSettings: <CloudflareSettings>(settings: ApiProviderSettings) => {
		const settingsSchema = getProviderSettingsSchema(Cloudflare);
		return doParseSettings(settings, settingsSchema!) as CloudflareSettings;
	},
	generate: async (request, settings) => {
		try {
			const imageCount = request.n || 1;

			// Generate images in parallel using Promise.all
			const generatePromises = Array.from({ length: imageCount }, () => generateSingle(request, settings));

			const results = await Promise.all(generatePromises);
			const allImages = results.flat();

			return {
				images: allImages,
			};
		} catch (error: any) {
			if (error.message === "CONFIG_ERROR") {
				return {
					errorReason: "CONFIG_ERROR",
					images: [],
				};
			}
			if (error.message === "TOO_MANY_REQUESTS") {
				return {
					errorReason: "TOO_MANY_REQUESTS",
					images: [],
				};
			}
			throw error;
		}
	},
};

export default Cloudflare;
