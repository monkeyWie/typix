import { GoogleGenAI } from "@google/genai";
import type { TypixGenerateRequest } from "../types/api";
import type { AiProvider, ApiProviderSettings, ApiProviderSettingsItem } from "../types/provider";
import { type ProviderSettingsType, chooseAblility, doParseSettings, findModel } from "../types/provider";

const googleSettingsSchema = [
	{
		key: "apiKey",
		type: "password",
		required: true,
	},
] as const satisfies ApiProviderSettingsItem[];

// Automatically generate type from schema
export type GoogleSettings = ProviderSettingsType<typeof googleSettingsSchema>;

// Single image generation helper function
const generateSingle = async (request: TypixGenerateRequest, settings: ApiProviderSettings): Promise<string[]> => {
	const { apiKey } = Google.parseSettings<GoogleSettings>(settings);

	const ai = new GoogleGenAI({ apiKey });

	const ability = chooseAblility(request, findModel(Google, request.modelId).ability);

	let contents: any;

	if (ability === "t2i") {
		// Text-to-image generation
		contents = request.prompt;
	} else {
		// Image-to-image generation
		const promptParts: any[] = [{ text: request.prompt }];

		// Add images to the prompt
		if (request.images && request.images.length > 0) {
			for (const imageDataUri of request.images) {
				// Extract MIME type and base64 data from DataURI
				const [mimeTypePart, base64Data] = imageDataUri.split(",");
				if (!base64Data || !mimeTypePart) {
					throw new Error("Invalid DataURI format");
				}

				// Extract MIME type (e.g., "data:image/png;base64" -> "image/png")
				const mimeTypeMatch = mimeTypePart.match(/data:([^;]+)/);
				const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";

				promptParts.push({
					inlineData: {
						mimeType,
						data: base64Data,
					},
				});
			}
		}

		contents = promptParts;
	}

	const response = await ai.models.generateContent({
		model: request.modelId,
		contents,
	});

	const images: string[] = [];

	// Process response parts
	if (response.candidates && response.candidates.length > 0) {
		const candidate = response.candidates[0];
		if (candidate?.content?.parts) {
			for (const part of candidate.content.parts) {
				if (part.inlineData) {
					// Convert base64 to DataURI format
					const mimeType = part.inlineData.mimeType || "image/png";
					const base64Data = part.inlineData.data;
					const dataUri = `data:${mimeType};base64,${base64Data}`;
					images.push(dataUri);
				}
			}
		}
	}

	return images;
};

const Google: AiProvider = {
	id: "google",
	name: "Google",
	supportCors: true,
	enabledByDefault: true,
	settings: googleSettingsSchema,
	models: [
		{
			id: "gemini-3-pro-image-preview",
			name: "Nano Banana Pro",
			ability: "i2i",
			maxInputImages: 4,
			enabledByDefault: true,
		},
		{
			id: "gemini-2.5-flash-image-preview",
			name: "Nano Banana",
			ability: "i2i",
			maxInputImages: 4,
			enabledByDefault: true,
		},
		{
			id: "gemini-2.0-flash-preview-image-generation",
			name: "Gemini 2.0 Flash Image Generation",
			ability: "i2i",
			maxInputImages: 4,
			enabledByDefault: true,
		},
		{
			id: "imagen-4.0-generate-001",
			name: "Imagen 4.0",
			ability: "t2i",
			enabledByDefault: true,
		},
		{
			id: "imagen-4.0-ultra-generate-001",
			name: "Imagen 4.0 Ultra",
			ability: "t2i",
			enabledByDefault: true,
		},
		{
			id: "imagen-4.0-fast-generate-001",
			name: "Imagen 4.0 Fast",
			ability: "t2i",
			enabledByDefault: true,
		},
		{
			id: "imagen-3.0-generate-002",
			name: "Imagen 3.0",
			ability: "t2i",
			enabledByDefault: true,
		},
	],
	parseSettings: <GoogleSettings>(settings: ApiProviderSettings) => {
		return doParseSettings(settings, googleSettingsSchema) as GoogleSettings;
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
			// Handle common Google AI errors
			if (error?.status === 401 || error?.message?.includes("API key")) {
				return {
					errorReason: "CONFIG_ERROR",
					images: [],
				};
			}

			if (error?.status === 400 && error?.message?.includes("quota")) {
				return {
					errorReason: "API_ERROR",
					images: [],
				};
			}

			throw error;
		}
	},
};

export default Google;
