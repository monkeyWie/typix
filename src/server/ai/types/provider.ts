import type { TypixChatApiResponse, TypixGenerateRequest } from "./api";
import type { AiModel } from "./model";

export type ApiProviderSettingsItemValue = string | number | boolean;

export interface ApiProviderSettingsItem {
	key: string;
	type: "string" | "password" | "url" | "number" | "boolean";
	required: boolean;
	defaultValue?: ApiProviderSettingsItemValue;
	options?: string[]; // For string, this can be ["bar", "foo"]
	min?: number; // For number, minimum value
	max?: number; // For number, maximum value
}

export interface ApiProviderSettings {
	[key: string]: ApiProviderSettingsItemValue;
}

export interface AiProvider {
	id: string;
	name: string;
	settings?: ApiProviderSettingsItem[] | (() => ApiProviderSettingsItem[]);
	supportCors?: boolean; // Whether this provider API supports CORS
	enabledByDefault?: boolean; // Whether this provider is enabled by default
	models: AiModel[];

	parseSettings<T>(settings: ApiProviderSettings): T;
	generate: (request: TypixGenerateRequest, settings: ApiProviderSettings) => Promise<TypixChatApiResponse>;
}

// Generic type-safe settings accessor
export type ProviderSettingsType<T extends readonly ApiProviderSettingsItem[]> = {
	[K in T[number] as K["key"]]: K["required"] extends true
		? K["type"] extends "string" | "password" | "url"
			? string
			: K["type"] extends "number"
				? number
				: K["type"] extends "boolean"
					? boolean
					: never
		: K["type"] extends "string" | "password" | "url"
			? string | undefined
			: K["type"] extends "number"
				? number | undefined
				: K["type"] extends "boolean"
					? boolean | undefined
					: never;
};

// Generic settings validator and extractor
export function doParseSettings<T extends readonly ApiProviderSettingsItem[]>(
	settings: ApiProviderSettings,
	settingsSchema: T,
): ProviderSettingsType<T> {
	const result: any = {};

	for (const schema of settingsSchema) {
		const value = settings[schema.key];

		// Check if required field is missing
		if (schema.required && (value === undefined || value === null || value === "")) {
			throw new Error(`Missing required setting: ${schema.key}`);
		}

		// Type validation and conversion
		if (value !== undefined && value !== null && value !== "") {
			switch (schema.type) {
				case "string":
				case "password":
				case "url": {
					if (typeof value !== "string") {
						throw new Error(`Setting '${schema.key}' must be a string, got ${typeof value}`);
					}
					const trimmedValue = value.trim();
					if (schema.required && !trimmedValue) {
						throw new Error(`Setting '${schema.key}' cannot be empty`);
					}
					result[schema.key] = trimmedValue;
					break;
				}
				case "number": {
					const numValue = typeof value === "number" ? value : Number(value);
					if (Number.isNaN(numValue)) {
						throw new Error(`Setting '${schema.key}' must be a valid number, got '${value}'`);
					}
					if (schema.min !== undefined && numValue < schema.min) {
						throw new Error(`Setting '${schema.key}' must be at least ${schema.min}, got ${numValue}`);
					}
					if (schema.max !== undefined && numValue > schema.max) {
						throw new Error(`Setting '${schema.key}' must be at most ${schema.max}, got ${numValue}`);
					}
					result[schema.key] = numValue;
					break;
				}
				case "boolean": {
					let boolValue: boolean;
					if (typeof value === "boolean") {
						boolValue = value;
					} else if (typeof value === "string") {
						const lowerValue = value.toLowerCase().trim();
						if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes") {
							boolValue = true;
						} else if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no") {
							boolValue = false;
						} else {
							throw new Error(`Setting '${schema.key}' must be a boolean value, got '${value}'`);
						}
					} else {
						throw new Error(`Setting '${schema.key}' must be a boolean, got ${typeof value}`);
					}
					result[schema.key] = boolValue;
					break;
				}
				default:
					throw new Error(`Unknown setting type: ${(schema as any).type}`);
			}
		} else if (!schema.required && schema.defaultValue !== undefined) {
			// Apply default value for optional fields
			result[schema.key] = schema.defaultValue;
		}
	}

	return result as ProviderSettingsType<T>;
}

// Helper function to get settings schema (handles both direct array and function)
export function getProviderSettingsSchema(provider: AiProvider): ApiProviderSettingsItem[] | undefined {
	if (!provider.settings) {
		return undefined;
	}

	return typeof provider.settings === "function" ? provider.settings() : provider.settings;
}
