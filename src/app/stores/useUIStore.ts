import type { Theme, ThemeColor } from "@/server/db/schemas";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UIState {
	initialized: boolean;
	setInitialized: (initialized: boolean) => void;
	// Mobile detection state
	isMobile?: boolean;
	setIsMobile: (isMobile: boolean) => void;
	// UI state
	theme: Theme;
	setTheme: (theme: Theme) => void;
	themeColor: ThemeColor;
	setThemeColor: (themeColor: ThemeColor) => void;
	language?: string;
	setLanguage: (language: string) => void;
	// Auth UI state
	isLoginModalOpen: boolean;
	openLoginModal: () => void;
	closeLoginModal: () => void;
}

export const useUIStore = create<UIState>()(
	devtools(
		persist(
			(set) => ({
				initialized: false,
				setInitialized: (initialized) => set({ initialized }),
				// Initialize mobile detection state
				isMobile: undefined,
				setIsMobile: (isMobile) => set({ isMobile }),
				// Initialize UI state
				theme: "system",
				setTheme: (theme) => set({ theme }),
				themeColor: "default",
				setThemeColor: (themeColor) => set({ themeColor }),
				language: "system",
				setLanguage: (language) => set({ language }),
				// Auth UI state
				isLoginModalOpen: false,
				openLoginModal: () => set({ isLoginModalOpen: true }),
				closeLoginModal: () => set({ isLoginModalOpen: false }),
			}),
			{
				name: "ui-store", // unique name for the store
				partialize: (state) => ({
					initialized: state.initialized,
					theme: state.theme,
					themeColor: state.themeColor,
					language: state.language,
				}),
			},
		),
	),
);
