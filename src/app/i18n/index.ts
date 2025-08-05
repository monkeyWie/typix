import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Dynamically import all locale files using Vite's glob import
const localeModules = import.meta.glob("./locales/*.json", { eager: true });

// Build resources object dynamically
const resources: Record<string, { translation: any }> = {};

for (const path in localeModules) {
	// Extract language key from file path (e.g., './locales/en.json' -> 'en')
	const langKey = path.replace("./locales/", "").replace(".json", "");
	const module = localeModules[path] as { default: any };

	resources[langKey] = {
		translation: module.default,
	};
}

i18n
	.use(LanguageDetector) // Detect user language
	.use(initReactI18next) // Passes i18n down to react-i18next
	.init({
		resources,
		fallbackLng: "en", // Default language if detection fails
		debug: process.env.NODE_ENV === "development",

		interpolation: {
			escapeValue: false, // React already does escaping
		},

		detection: {
			order: ["localStorage", "navigator", "htmlTag"],
			caches: ["localStorage"],
		},
	});

export default i18n;
