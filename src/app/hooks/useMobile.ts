import { useUIStore } from "@/app/stores";

// Hook to get mobile state from UIStore
export function useIsMobile() {
	return useUIStore((state) => state.isMobile!);
}
