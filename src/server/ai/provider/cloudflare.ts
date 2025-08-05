import { inCfWorker } from "@/server/lib/env";
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
		return inCfWorker && getContext().PROVIDER_CLOUDFLARE_BUILTIN === true
			? cloudflareSettingsBuiltinSchema
			: cloudflareSettingsNotBuiltInSchema;
	},
	enabledByDefault: true,
	models: [
		{
			id: "@cf/black-forest-labs/flux-1-schnell",
			name: "FLUX.1-schnell",
			supportImageEdit: false,
			enabledByDefault: true,
		},
		{
			id: "@cf/bytedance/stable-diffusion-xl-lightning",
			name: "Stable Diffusion XL Lightning",
			enabledByDefault: true,
			supportImageEdit: false,
		},
		{
			id: "@cf/lykon/dreamshaper-8-lcm",
			name: "DreamShaper 8 LCM",
			enabledByDefault: true,
			supportImageEdit: false,
		},
		{
			id: "@cf/runwayml/stable-diffusion-v1-5-img2img",
			name: "Stable Diffusion v1.5 Img2Img",
			enabledByDefault: true,
			supportImageEdit: true,
		},
		{
			id: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
			name: "Stable Diffusion v1.5 Inpainting",
			enabledByDefault: true,
			supportImageEdit: false,
		},
		{
			id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
			name: "Stable Diffusion XL Base 1.0",
			enabledByDefault: true,
			supportImageEdit: false,
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

			return {
				images: [resp.image],
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
			const errorText = await resp.text();
			throw new Error(`Cloudflare API error: ${resp.status} ${resp.statusText} - ${errorText}`);
		}

		const contentType = resp.headers.get("Content-Type");
		if (contentType?.includes("image/png") === true) {
			const imageBuffer = await resp.arrayBuffer();
			return {
				images: [Buffer.from(imageBuffer).toString("base64")],
			};
		}

		const result = (await resp.json()) as unknown as any;
		return {
			images: [result.result.image],
		};
	},
};

export default Cloudflare;
