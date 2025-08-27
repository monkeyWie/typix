import { apiClient } from "@/app/lib/api-client";
import { inBrowser } from "@/server/lib/env";
import { ServiceException } from "@/server/lib/exception";
import type { AiProvider } from "../types/provider";
import { default as cloudflare } from "./cloudflare";
import { default as fal } from "./fal";
import { default as flux } from "./flux";
import { default as google } from "./google";
import { default as openAI } from "./openai";

export const AI_PROVIDERS = [cloudflare, google, openAI, flux, fal].map(enhancedProvider);

export function getDefaultProvider() {
	return AI_PROVIDERS[0]!;
}

export function getProviderById(providerId: string) {
	const provider = AI_PROVIDERS.find((provider) => provider.id === providerId);
	if (!provider) {
		throw new ServiceException("not_found", "AI provider not found in system");
	}
	return provider;
}

export function getModelById(providerId: string, modelId: string) {
	const provider = getProviderById(providerId);
	const model = provider.models.find((model) => model.id === modelId);
	if (!model) {
		throw new ServiceException("not_found", `Model ${modelId} not found in provider ${providerId}`);
	}
	return model;
}

function enhancedProvider(provider: AiProvider): AiProvider {
	return {
		...provider,
		generate: async (request, settings) => {
			// Check is browser environment
			if (!inBrowser || provider.supportCors) {
				return await provider.generate(request, settings);
			}

			// For providers that do not support CORS, we need to proxy the request by the server
			const resp = await apiClient.api.ai["no-auth"][":providerId"].generate.$post({
				param: {
					providerId: provider.id,
				},
				json: {
					request,
					settings,
				},
			});
			if (!resp.ok) {
				throw new ServiceException("error", `Failed to generate with provider ${provider.id}: ${resp.statusText}`);
			}

			const result = await resp.json();
			if (result.code !== "ok") {
				throw new ServiceException(result.code, result.message || `Failed to generate with provider ${provider.id}`);
			}

			return result.data!;
		},
	};
}
