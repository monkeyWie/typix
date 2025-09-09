import { fetchUrlToDataURI } from "@/server/lib/util";
import type { TypixGenerateRequest } from "../types/api";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import { type ProviderSettingsType, chooseAblility, doParseSettings, findModel } from "../types/provider";

// Single image generation helper function
const generateSingle = async (request: TypixGenerateRequest, settings: ApiProviderSettings): Promise<string[]> => {
	const { apiKey } = Flux.parseSettings<FluxSettings>(settings);

	const model = findModel(Flux, request.modelId);
	const genType = chooseAblility(request, model.ability);

	const requestBody: any = {
		prompt: request.prompt,
	};
	if (genType === "i2i" && request.images?.[0]) {
		requestBody.image_url = request.images[0];
	}

	const submitResponse = await fetch(`https://api.bfl.ai/v1/${request.modelId}`, {
		method: "POST",
		headers: {
			accept: "application/json",
			"x-key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestBody),
	});

	if (!submitResponse.ok) {
		if (submitResponse.status === 403) {
			throw new Error("CONFIG_ERROR");
		}
		throw new Error(`Flux API error: ${submitResponse.status} ${submitResponse.statusText}`);
	}

	const submitData: FluxSubmitResponse = await submitResponse.json();
	const { id: requestId, polling_url: pollingUrl } = submitData;

	let attempts = 0;
	const maxAttempts = 120;

	while (attempts < maxAttempts) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		attempts++;

		const pollUrl = new URL(pollingUrl);
		pollUrl.searchParams.set("id", requestId);

		const pollResponse = await fetch(pollUrl.toString(), {
			method: "GET",
			headers: {
				accept: "application/json",
				"x-key": apiKey,
			},
		});

		if (!pollResponse.ok) {
			throw new Error(`Flux polling error: ${pollResponse.status} ${pollResponse.statusText}`);
		}

		const pollData: FluxPollResponse = await pollResponse.json();

		if (pollData.status === "Ready" && pollData.result?.sample) {
			try {
				const imageDataUri = await fetchUrlToDataURI(pollData.result.sample);
				return [imageDataUri];
			} catch (error) {
				console.error("Flux image fetch error:", error);
				return [];
			}
		} else if (pollData.status === "Error" || pollData.status === "Failed") {
			throw new Error(`Flux generation failed: ${pollData.error || "Unknown error"}`);
		}
	}

	throw new Error("Flux generation timeout - exceeded maximum polling attempts");
};

const fluxSettingsSchema = [
	{
		key: "apiKey",
		type: "password",
		required: true,
	},
] as const satisfies ApiProviderSettingsItem[];

// Automatically generate type from schema
export type FluxSettings = ProviderSettingsType<typeof fluxSettingsSchema>;

interface FluxSubmitResponse {
	id: string;
	polling_url: string;
}

interface FluxPollResponse {
	id: string;
	status: "Pending" | "Running" | "Ready" | "Error" | "Failed";
	result?: {
		sample: string;
	};
	error?: string;
}

const Flux: AiProvider = {
	id: "flux",
	name: "Flux",
	supportCors: false,
	enabledByDefault: true,
	settings: fluxSettingsSchema,
	models: [
		{
			id: "flux-kontext-max",
			name: "FLUX.1 Kontext [max]",
			ability: "i2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "flux-kontext-pro",
			name: "FLUX.1 Kontext [pro]",
			ability: "i2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "flux-pro-1.1-ultra",
			name: "FLUX1.1 [pro] Ultra",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "flux-pro-1.1",
			name: "FLUX1.1 [pro]",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "flux-pro",
			name: "FLUX.1 [pro]",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
		{
			id: "flux-dev",
			name: "FLUX.1 [dev]",
			ability: "t2i",
			enabledByDefault: true,
			supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
		},
	],
	parseSettings: <FluxSettings>(settings: ApiProviderSettings) => {
		return doParseSettings(settings, fluxSettingsSchema) as FluxSettings;
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
			throw error;
		}
	},
};

export default Flux;
