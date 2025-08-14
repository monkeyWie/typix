import { inCfWorker } from "@/server/lib/env";
import { base64ToDataURI, readableStreamToDataURI } from "@/server/lib/util";
import { getContext } from "@/server/service/context";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import { type ProviderSettingsType, doParseSettings, getProviderSettingsSchema } from "../types/provider";

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

const Cloudflare: AiProvider = {
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
		},
		{
			id: "@cf/bytedance/stable-diffusion-xl-lightning",
			name: "Stable Diffusion XL Lightning",
			ability: "t2i",
			enabledByDefault: true,
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
		},
	],
	parseSettings: <CloudflareSettings>(settings: ApiProviderSettings) => {
		const settingsSchema = getProviderSettingsSchema(Cloudflare);
		return doParseSettings(settings, settingsSchema!) as CloudflareSettings;
	},
	generate: async (request, settings) => {
		const AI = getContext().AI;
		const { builtin, apiKey, accountId } = Cloudflare.parseSettings<CloudflareSettings>(settings);

		if (inCfWorker && AI && builtin === true) {
			const resp = await AI.run(request.modelId as unknown as any, {
				prompt: request.prompt,
			});

			if (resp instanceof ReadableStream) {
				return {
					images: [await readableStreamToDataURI(resp)],
				};
			}

			return {
				images: [base64ToDataURI(resp.image)],
			};
		}

		const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${request.modelId}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				prompt: request.prompt,
			}),
		});

		if (!resp.ok) {
			if (resp.status === 401 || resp.status === 404) {
				return {
					errorReason: "CONFIG_ERROR",
					images: [],
				};
			}

			const errorText = await resp.text();
			throw new Error(`Cloudflare API error: ${resp.status} ${resp.statusText} - ${errorText}`);
		}

		const contentType = resp.headers.get("Content-Type");
		if (contentType?.includes("image/png") === true) {
			const imageBuffer = await resp.arrayBuffer();
			return {
				images: [base64ToDataURI(Buffer.from(imageBuffer).toString("base64"))],
			};
		}

		const result = (await resp.json()) as unknown as any;
		return {
			images: [base64ToDataURI(result.result.image)],
		};
	},
};

export default Cloudflare;
