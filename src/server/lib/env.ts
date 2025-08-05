export const inBrowser = typeof globalThis.window !== "undefined";
export const mode: "client" | "mixed" = inBrowser ? (import.meta.env.MODE === "client" ? "client" : "mixed") : "mixed";
/*
 * Check if the environment is Cloudflare Workers
 * If in browser environment, check environment variable
 * If in backend, check if process is undefined or RUNTIME is set to cloudflare workers
 */
export const inCfWorker = inBrowser ? import.meta.env.RUNTIME === "cloudflare" : "WorkerGlobalScope" in globalThis;
