import type { ApiResult } from "@/server/api/util";
import { ServiceException } from "@/server/lib/exception";
import { aiService } from "@/server/service/ai";
import { chatService } from "@/server/service/chat";
import { type RequestContext, localUserId } from "@/server/service/context";
import { settingsService } from "@/server/service/settings";
import { useMemo } from "react";
import useSWR from "swr";
import type { SWRResponse } from "swr";
import useSWRMutation from "swr/mutation";
import type { SWRMutationConfiguration, SWRMutationResponse } from "swr/mutation";
import { apiClient } from "../lib/api-client";
import { useAuth } from "./useAuth";

// Extract return type from Promise
type ExtractPromiseType<T> = T extends Promise<infer U> ? U : T;

// Remove the last parameter (userId) from function parameters
type RemoveLastParam<T extends readonly unknown[]> = T extends readonly [...infer Rest, any] ? Rest : T;

// Transform function type to remove last parameter and preserve exact return type
type TransformFunction<T> = T extends (...args: infer P) => infer R ? (...args: RemoveLastParam<P>) => R : T;

// Helper type to determine the correct argument type for SWR mutation
type SWRMutationArgument<T extends readonly unknown[]> = T extends readonly []
	? undefined
	: T extends readonly [infer Single]
		? Single
		: T;

// Create enhanced service type with SWR methods for all methods
type EnhancedService<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any
		? TransformFunction<T[K]> & {
				swr: <TData = ExtractPromiseType<ReturnType<T[K]>>>(
					key: string | null,
					...args: RemoveLastParam<Parameters<T[K]>>
				) => SWRResponse<TData, Error>;
				swrMutation: <TData = ExtractPromiseType<ReturnType<T[K]>>>(
					key: string | null,
					config?: SWRMutationConfiguration<
						TData,
						Error,
						string | null,
						SWRMutationArgument<RemoveLastParam<Parameters<T[K]>>>
					>,
				) => SWRMutationResponse<TData, Error, string | null, SWRMutationArgument<RemoveLastParam<Parameters<T[K]>>>>;
			}
		: T[K];
};

// Cache for enhanced services to avoid recreating proxy objects
const serviceCache = new WeakMap<any, EnhancedService<any>>();

// Create enhanced service (no auth loading check needed since root ensures auth is loaded)
function createEnhancedService<T>(baseService: T): EnhancedService<T> {
	// Use cache to avoid recreating proxy objects
	if (serviceCache.has(baseService)) {
		return serviceCache.get(baseService)!;
	}

	// Create proxy to add SWR methods to each service method
	const enhanced = new Proxy(baseService as any, {
		get(target, prop) {
			const originalMethod = target[prop];
			const requestContext: RequestContext = {
				userId: localUserId,
			};

			// If it's a function, enhance it with SWR methods
			if (typeof originalMethod === "function") {
				// Create enhanced method that removes the last parameter (userId)
				const enhancedMethod = (...args: any[]) => {
					// Add localUserId as the last parameter
					return originalMethod.apply(target, [...args, requestContext]);
				};

				// Add SWR method - create a fetcher that calls the original method
				enhancedMethod.swr = (key: string | null, ...args: any[]) => {
					const fetcher = async () => {
						// Add localUserId as the last parameter
						return await originalMethod.call(target, ...args, requestContext);
					};

					return useSWR(key, fetcher);
				};

				// Add SWR mutation method
				enhancedMethod.swrMutation = (key: string | null, config?: any) => {
					const mutationFetcher = async (_key: string | null, { arg }: { arg: any }) => {
						// Handle different argument patterns
						if (arg === undefined) {
							// No arguments case (only userId needed)
							return await originalMethod.call(target, requestContext);
						}
						if (Array.isArray(arg)) {
							// Multiple arguments case - spread array and add localUserId
							return await originalMethod.call(target, ...arg, requestContext);
						}
						// Single argument case
						return await originalMethod.call(target, arg, requestContext);
					};

					return useSWRMutation(key, mutationFetcher, config);
				};

				return enhancedMethod;
			}

			return originalMethod;
		},
	}) as EnhancedService<T>;

	// Cache the enhanced service
	serviceCache.set(baseService, enhanced);
	return enhanced;
}

/**
 * Custom hook that selects between local and remote service implementations
 * Preserves full type inference for the returned service and adds SWR methods
 * Uses caching to avoid recreating proxy objects on each call
 *
 * @param defaultService - Local service implementation
 * @param apiService - Remote API service implementation
 * @returns The appropriate service based on authentication status with SWR methods
 */
function useService<T extends Record<string, any>>(defaultService: T, apiService: T): EnhancedService<T> {
	const { isLogin } = useAuth();

	// Memoize service selection to prevent unnecessary re-computations
	const service = useMemo(() => {
		return isLogin ? apiService : defaultService;
	}, [isLogin, apiService, defaultService]);

	// Memoize enhanced service creation
	return useMemo(() => {
		return createEnhancedService(service);
	}, [service]);
}

/**
 * Core API request handler
 * Handles both requests with and without arguments
 */
async function doRequest<T>(apiCall: (...args: any[]) => Promise<Response>, ...args: any[]): Promise<T> {
	try {
		// API calls do not pass localUserId, only when there are more than 1 arguments does it pass the first argument as request body
		const resp = args.length > 1 ? await apiCall({ json: args[0] }) : await apiCall();

		if (!resp.ok) {
			throw new ServiceException("error", `API request failed with status: ${resp.status}`);
		}

		const data = (await resp.json()) as ApiResult<T>;
		const apiResult = data as ApiResult<T>;
		if (apiResult.code !== "ok") {
			throw new ServiceException(apiResult.code, apiResult.message || "API request failed");
		}

		return data.data || ({} as T);
	} catch (error) {
		console.error("API request failed:", error);
		throw error;
	}
}

// Service proxy cache to avoid recreating proxies
const apiServiceCache = new WeakMap<Record<string, any>, any>();

function createApiServiceProxy<T extends Record<string, any>>(apiEndpoints: Record<string, any>): T {
	// Check cache first
	if (apiServiceCache.has(apiEndpoints)) {
		return apiServiceCache.get(apiEndpoints);
	}

	const proxy = new Proxy({} as T, {
		get(target, prop: string | symbol) {
			if (typeof prop === "string") {
				// Look for a property with $post method
				const dynamicEndpoint = apiEndpoints[prop];
				if (dynamicEndpoint && typeof dynamicEndpoint.$post === "function") {
					return async (...args: any[]) => {
						return await doRequest(dynamicEndpoint.$post, ...args);
					};
				}

				throw new Error(`API endpoint not found for method: ${prop}`);
			}
			return undefined;
		},
	});

	// Cache the proxy
	apiServiceCache.set(apiEndpoints, proxy);
	return proxy;
}

export function useChatService() {
	const apiService = useMemo(() => createApiServiceProxy<typeof chatService>(apiClient.api.chats), []);
	return useService(chatService, apiService);
}

export function useSettingsService() {
	const apiService = useMemo(() => createApiServiceProxy<typeof settingsService>(apiClient.api.settings), []);
	return useService(settingsService, apiService);
}

export function useAiService() {
	const apiService = useMemo(() => createApiServiceProxy<typeof aiService>(apiClient.api.ai), []);
	return useService(aiService, apiService);
}
