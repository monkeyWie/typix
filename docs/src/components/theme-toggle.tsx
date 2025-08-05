"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

	// Only show the toggle after mounting to prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Determine the actual applied theme (considering system preference)
	useEffect(() => {
		if (!mounted) return;

		const getAppliedTheme = () => {
			if (theme === "system") {
				return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			}
			return theme as "light" | "dark";
		};

		const appliedTheme = getAppliedTheme();
		setCurrentTheme(appliedTheme);

		// Listen for system theme changes when theme is set to 'system'
		if (theme === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = (e: MediaQueryListEvent) => {
				setCurrentTheme(e.matches ? "dark" : "light");
			};

			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme, mounted]);

	const handleToggle = () => {
		if (!mounted) return;

		// Toggle between light and dark, always set explicit theme (not system)
		const newTheme = currentTheme === "dark" ? "light" : "dark";
		setTheme(newTheme);
	};

	// Always render the same button structure for SSR
	// Only change the icon based on current applied theme after mounting
	return (
		<button
			type="button"
			onClick={handleToggle}
			className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/20 backdrop-blur-sm transition-all duration-300 hover:border-border/40 hover:bg-accent/10 hover:backdrop-blur-md disabled:cursor-default"
			aria-label="Toggle theme"
			disabled={!mounted}
		>
			{!mounted ? (
				<div className="h-4 w-4" />
			) : currentTheme === "dark" ? (
				<Sun className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-foreground" />
			) : (
				<Moon className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-foreground" />
			)}
		</button>
	);
}
