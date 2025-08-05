import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { useSettingsService } from "@/app/hooks/useService";
import { THEME_COLOR_KEYS, getThemePreviewColors } from "@/app/lib/theme-colors";
import { SettingsItem } from "@/app/routes/settings/-components/SettingsItem";
import { SettingsPageLayout } from "@/app/routes/settings/-components/SettingsPageLayout";
import { useUIStore } from "@/app/stores";
import type { Theme, ThemeColor } from "@/server/db/schemas";
import type { UpdateSettings } from "@/server/service/settings";
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

// Import settingsService to infer types
import type { settingsService } from "@/server/service/settings";

// Infer types from service methods
type SettingsData = Awaited<ReturnType<typeof settingsService.getSettings>>;

// Combined settings type (server + UI store)
type CombinedSettings = Partial<SettingsData> & {
	theme: Theme;
	themeColor: ThemeColor;
	language?: string;
};

interface GeneralSettingsProps {
	settings: CombinedSettings;
	updateSetting: (key: keyof UpdateSettings, value: any) => Promise<void>;
	isLoading: boolean;
}

export const Route = createFileRoute("/settings/common")({
	component: CommonSettingsPage,
});

function CommonSettingsPage() {
	const settingsService = useSettingsService();
	const { theme, themeColor, language, setTheme, setThemeColor, setLanguage } = useUIStore();

	// Use SWR to get settings (mainly for initialization)
	const { data: serverSettings, isLoading, error } = settingsService.getSettings.swr("settings");

	// SWR mutation for updating settings
	const { trigger: updateSettings, isMutating } = settingsService.updateSettings.swrMutation("update-settings");

	// Combine server settings with UI store for display (UI store takes precedence for immediate updates)
	const settings = {
		...serverSettings,
		theme,
		themeColor,
		language,
	};

	// Helper function to update a setting with optimistic update
	const updateSetting = async (key: string, value: any) => {
		try {
			// Optimistic update - update UI store immediately
			if (key === "theme") {
				setTheme(value);
			} else if (key === "themeColor") {
				setThemeColor(value);
			} else if (key === "language") {
				setLanguage(value);
			}

			// Update server in background - don't await to avoid loading state
			updateSettings({ [key]: value }).catch((error) => {
				console.error("Failed to update setting:", error);
				// TODO: Implement error recovery if needed
			});
		} catch (error) {
			console.error("Failed to update setting:", error);
		}
	};

	return (
		<SettingsPageLayout isLoading={isLoading && !settings.theme} maxWidthFit={true}>
			<GeneralSettings settings={settings} updateSetting={updateSetting} isLoading={isLoading} />
		</SettingsPageLayout>
	);
}

interface ThemeItem {
	value: Theme;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}

// General Settings Component - includes theme and language
function GeneralSettings({ settings, updateSetting, isLoading }: GeneralSettingsProps) {
	const { t, i18n } = useTranslation();

	// Get available languages from i18next resources
	const availableLanguages = Object.keys(i18n.store.data);

	// Generate language options dynamically
	const getLanguageOptions = () => {
		const systemOption = {
			value: "system",
			label: t("language.followSystem"),
		};

		const languageOptions = availableLanguages.map((langKey) => {
			// Try to get the label from the language's own translation
			const label = i18n.getResourceBundle(langKey, "translation")?.language?.label;
			return {
				value: langKey, // Use the i18n language key directly as value
				label: label || langKey, // Fallback to language key if no label found
			};
		});

		return [systemOption, ...languageOptions];
	};

	// Only show loading on initial load when no UI store data is available
	if (isLoading && !settings.theme) return <div>{t("common.loading")}</div>;

	return (
		<div className="space-y-8">
			{/* Theme Settings */}
			<SettingsItem title={t("settings.theme")}>
				<div className="flex gap-2">
					{(
						[
							{
								value: "system",
								label: t("theme.auto"),
								icon: Monitor,
							},
							{
								value: "light",
								label: t("theme.light"),
								icon: Sun,
							},
							{
								value: "dark",
								label: t("theme.dark"),
								icon: Moon,
							},
						] satisfies ThemeItem[]
					).map((theme) => {
						const IconComponent = theme.icon;
						const isActive = settings.theme === theme.value;

						return (
							<button
								key={theme.value}
								type="button"
								className={`group relative flex flex-col items-center gap-2 rounded-lg pl-3 transition-all hover:scale-105 ${
									isActive ? "" : "hover:bg-muted/50"
								}`}
								onClick={() => updateSetting("theme", theme.value)}
								aria-label={t("theme.selectTheme", { theme: theme.label })}
							>
								{/* Theme preview div */}
								<div
									className={`h-12 w-20 rounded border transition-all ${
										isActive ? "border-blue-500 ring-1 ring-blue-500 ring-offset-1" : "border-border"
									} ${
										theme.value === "light"
											? "bg-white"
											: theme.value === "dark"
												? "bg-gray-900"
												: "bg-gradient-to-br from-white to-gray-900"
									}`}
								>
									{/* Preview content */}
									<div className="flex h-full flex-col p-2">
										<div
											className={`mb-1 h-0.5 w-full rounded ${
												theme.value === "light" ? "bg-gray-200" : theme.value === "dark" ? "bg-gray-700" : "bg-gray-400"
											}`}
										/>
										<div
											className={`h-0.5 w-3/4 rounded ${
												theme.value === "light" ? "bg-gray-300" : theme.value === "dark" ? "bg-gray-600" : "bg-gray-500"
											}`}
										/>
									</div>
								</div>

								{/* Icon and label */}
								<div className="flex items-center gap-1">
									<IconComponent
										className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
									/>
									<span
										className={`font-medium text-sm transition-colors ${
											isActive ? "text-primary" : "text-muted-foreground"
										}`}
									>
										{theme.label}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			</SettingsItem>

			{/* Theme Color Settings */}
			<SettingsItem title={t("settings.themeColor")} description={t("settings.themeColorDescription")}>
				<div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
					{THEME_COLOR_KEYS.map((themeColorKey) => {
						const previewColors = getThemePreviewColors(themeColorKey);
						const isActive = settings.themeColor === themeColorKey;

						return (
							<button
								key={themeColorKey}
								type="button"
								className={`group relative flex items-center justify-center rounded-lg p-2 transition-all hover:scale-105 ${
									isActive ? "" : "hover:bg-muted/50"
								}`}
								onClick={() => updateSetting("themeColor", themeColorKey)}
								aria-label={t("theme.selectThemeColor", { color: themeColorKey })}
							>
								{/* Color preview circle */}
								<div
									className={`h-8 w-8 rounded-full shadow-sm transition-all ${
										isActive ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/10"
									}`}
									style={{
										background: `linear-gradient(135deg, ${previewColors.light} 0%, ${previewColors.dark} 100%)`,
									}}
								/>
							</button>
						);
					})}
				</div>
			</SettingsItem>

			{/* Language Settings */}
			<SettingsItem title={t("settings.language")}>
				<Select value={settings.language || "system"} onValueChange={(value) => updateSetting("language", value)}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder={t("settings.selectLanguage")} />
					</SelectTrigger>
					<SelectContent>
						{getLanguageOptions().map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</SettingsItem>
		</div>
	);
}
