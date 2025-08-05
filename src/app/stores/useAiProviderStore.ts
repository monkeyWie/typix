import type { aiService } from "@/server/service/ai";
import { create } from "zustand";

export type AiProvider = Awaited<ReturnType<typeof aiService.getAiProviders>>[0];

interface AiProviderState {
	providers: AiProvider[];
	setProviders: (providers: AiProvider[]) => void;
}

export const useAiProviderStore = create<AiProviderState>((set) => ({
	providers: [],
	setProviders: (providers) => set({ providers }),
}));
