"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "gopeed-theme",
	...props
}: ThemeProviderProps) {
	// Always start with defaultTheme to ensure SSR/client consistency
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [mounted, setMounted] = useState(false);

	// Only run this effect on the client side
	useEffect(() => {
		setMounted(true);

		// Get the stored theme from localStorage
		const loadTheme = (): Theme => {
			try {
				const stored = localStorage.getItem(storageKey);
				return (stored as Theme) || defaultTheme;
			} catch {
				return defaultTheme;
			}
		};

		// Set the theme state with the stored value
		const loadedTheme = loadTheme();
		setTheme(loadedTheme);

		// Apply theme immediately to prevent flash
		const root = window.document.documentElement;
		const applyTheme = (newTheme: Theme) => {
			root.classList.remove("light", "dark");

			if (newTheme === "system") {
				const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
				root.classList.add(systemTheme);
			} else {
				root.classList.add(newTheme);
			}
		};

		applyTheme(loadedTheme);
	}, [defaultTheme, storageKey]);

	useEffect(() => {
		if (!mounted) return;

		const root = window.document.documentElement;

		const applyTheme = (newTheme: Theme) => {
			root.classList.remove("light", "dark");

			if (newTheme === "system") {
				const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
				root.classList.add(systemTheme);
			} else {
				root.classList.add(newTheme);
			}
		};

		applyTheme(theme);

		// Listen for system theme changes
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme === "system") {
				applyTheme("system");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme, mounted]);

	const value = {
		theme,
		setTheme: (newTheme: Theme) => {
			if (mounted) {
				localStorage.setItem(storageKey, newTheme);
			}
			setTheme(newTheme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
