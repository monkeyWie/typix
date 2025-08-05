import type { ThemeColor } from "@/server/db/schemas";

// Unified theme color configuration
// Contains CSS variables for each theme (except default)
export const THEME_COLORS = {
	default: {
		// Default theme has no CSS variables (uses index.css values)
		// Preview colors for default theme
		defaultPreview: {
			light: "oklch(0.21 0.006 285.885)", // default primary light from index.css
			dark: "oklch(0.92 0.004 286.32)", // default primary dark from index.css
		},
	},
	red: {
		cssVariables: {
			light: {
				primary: "oklch(0.637 0.237 25.331)",
				"primary-foreground": "oklch(0.971 0.013 17.38)",
				ring: "oklch(0.637 0.237 25.331)",
			},
			dark: {
				primary: "oklch(0.637 0.237 25.331)",
				"primary-foreground": "oklch(0.971 0.013 17.38)",
				ring: "oklch(0.637 0.237 25.331)",
			},
		},
	},
	rose: {
		cssVariables: {
			light: {
				primary: "oklch(0.645 0.246 16.439)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.645 0.246 16.439)",
			},
			dark: {
				primary: "oklch(0.645 0.246 16.439)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.645 0.246 16.439)",
			},
		},
	},
	orange: {
		cssVariables: {
			light: {
				primary: "oklch(0.646 0.222 41.116)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.646 0.222 41.116)",
			},
			dark: {
				primary: "oklch(0.646 0.222 41.116)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.646 0.222 41.116)",
			},
		},
	},
	green: {
		cssVariables: {
			light: {
				primary: "oklch(0.696 0.17 162.48)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.696 0.17 162.48)",
			},
			dark: {
				primary: "oklch(0.696 0.17 162.48)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.696 0.17 162.48)",
			},
		},
	},
	blue: {
		cssVariables: {
			light: {
				primary: "oklch(0.488 0.243 264.376)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.488 0.243 264.376)",
			},
			dark: {
				primary: "oklch(0.488 0.243 264.376)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.488 0.243 264.376)",
			},
		},
	},
	yellow: {
		cssVariables: {
			light: {
				primary: "oklch(0.795 0.184 86.047)",
				"primary-foreground": "oklch(0.141 0.005 285.823)",
				ring: "oklch(0.795 0.184 86.047)",
			},
			dark: {
				primary: "oklch(0.795 0.184 86.047)",
				"primary-foreground": "oklch(0.141 0.005 285.823)",
				ring: "oklch(0.795 0.184 86.047)",
			},
		},
	},
	violet: {
		cssVariables: {
			light: {
				primary: "oklch(0.627 0.265 303.9)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.627 0.265 303.9)",
			},
			dark: {
				primary: "oklch(0.627 0.265 303.9)",
				"primary-foreground": "oklch(0.985 0 0)",
				ring: "oklch(0.627 0.265 303.9)",
			},
		},
	},
} as const satisfies Record<ThemeColor, any>;

// Helper to get all theme color keys (for UI iteration)
export const THEME_COLOR_KEYS = Object.keys(THEME_COLORS) as ThemeColor[];

// Helper function to get preview colors for a theme
export function getThemePreviewColors(themeColorKey: ThemeColor) {
	if (themeColorKey === "default") {
		return THEME_COLORS.default.defaultPreview;
	}

	const themeConfig = THEME_COLORS[themeColorKey] as {
		cssVariables: { light: { primary: string }; dark: { primary: string } };
	};
	return {
		light: themeConfig.cssVariables.light.primary,
		dark: themeConfig.cssVariables.dark.primary,
	};
}
