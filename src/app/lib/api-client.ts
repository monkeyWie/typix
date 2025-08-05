import type { AppType } from "@/server/api";
import { hc } from "hono/client";

// Pre-compile Hono client types at compile time for better IDE performance
// This trick offloads type instantiation from tsserver to tsc
const client = hc<AppType>("");
export type ApiClient = typeof client;

// Create typed client factory with pre-calculated types
export const hcWithType = (...args: Parameters<typeof hc>): ApiClient => hc<AppType>(...args);

// Export pre-compiled client instance with optimized performance
// Using hcWithType to ensure we get the pre-compiled type benefits
export const apiClient = hcWithType("/", {
	fetch: (async (input, init) => {
		return fetch(input, {
			...init,
			credentials: "include", // Required for sending cookies cross-origin
		});
	}) satisfies typeof fetch,
});
