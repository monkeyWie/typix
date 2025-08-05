import { THEME_COLORS } from "@/app/lib/theme-colors";
import type { Theme, ThemeColor } from "@/server/db/schemas";
import { useEffect } from "react";

/**
 * Apply theme color CSS variables to the document root
 * Only overrides primary color and ring - keeps other colors unchanged
 */
export function useThemeColor(themeColor: ThemeColor) {
	useEffect(() => {
		const root = document.documentElement;
		const isDark = root.classList.contains("dark");

		// Remove any existing theme color custom properties (only the ones we manage)
		const managedProperties = ["--primary", "--primary-foreground", "--ring"];
		for (const prop of managedProperties) {
			root.style.removeProperty(prop);
		}

		// Apply theme color variables if not default
		if (themeColor !== "default") {
			const themeConfig = THEME_COLORS[themeColor];
			if (themeConfig.cssVariables) {
				const themeMode = isDark ? "dark" : "light";
				const variables = themeConfig.cssVariables[themeMode];

				// Apply only the theme color variables we manage
				for (const [key, value] of Object.entries(variables)) {
					root.style.setProperty(`--${key}`, value);
				}
			}
		}
	}, [themeColor]);
}

/**
 * Apply theme mode (light/dark/system) to the document root
 */
export function useTheme(theme: Theme) {
	useEffect(() => {
		const root = document.documentElement;

		// Remove existing theme classes
		root.classList.remove("light", "dark");

		if (theme === "system") {
			// Apply system theme
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			root.classList.add(systemTheme);
		} else {
			// Apply specified theme
			root.classList.add(theme);
		}
	}, [theme]);
}

/**
 * Combined hook for both theme mode and theme color management
 * Handles system theme changes automatically
 */
export function useThemeManager(theme: Theme, themeColor: ThemeColor, onSystemThemeChange?: (newTheme: Theme) => void) {
	// Apply theme mode
	useTheme(theme);

	// Apply theme color
	useThemeColor(themeColor);

	// Listen for system theme changes when using system theme
	useEffect(() => {
		if (theme !== "system" || !onSystemThemeChange) return;

		const handleSystemThemeChange = (e: MediaQueryListEvent) => {
			const newTheme = e.matches ? "dark" : "light";
			onSystemThemeChange(newTheme);
		};

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		mediaQuery.addEventListener("change", handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener("change", handleSystemThemeChange);
		};
	}, [theme, onSystemThemeChange]);
}
