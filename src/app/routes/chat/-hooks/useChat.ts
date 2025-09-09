import { useAuth } from "@/app/hooks/useAuth";
import { useAiService } from "@/app/hooks/useService";
import { useChatService } from "@/app/hooks/useService";
import type { AspectRatio } from "@/server/ai/types/api";
import type { chatService } from "@/server/service/chat";
import { localUserId } from "@/server/service/context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Type inference from service functions
type ChatData = NonNullable<Awaited<ReturnType<typeof chatService.getChatById>>>;
// User type for frontend
type User = {
	id: string;
	nickname: string;
	avatar?: string;
};

// Mock user data for demo purposes
const guestUser: User = {
	id: localUserId,
	nickname: localUserId,
	avatar: undefined,
};

export const useChat = (initialChatId?: string, selectedProvider?: string, selectedModel?: string) => {
	const { isLoading: authLoading, user, isLogin } = useAuth();
	const { t } = useTranslation();
	const chatService = useChatService();
	const aiService = useAiService();
	const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isChatIdValidated, setIsChatIdValidated] = useState(false);
	const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
	const [lastUserId, setLastUserId] = useState<string | null>(null);
	const [lastInitialChatId, setLastInitialChatId] = useState<string | undefined>(initialChatId);

	// Get available providers and models
	const { data: providers } = aiService.getEnabledAiProvidersWithModels.swr("ai-providers-with-models");

	// Get first available provider and model as fallback
	const getDefaultProviderAndModel = useCallback((): { provider: string | undefined; model: string | undefined } => {
		if (!providers || providers.length === 0) {
			return { provider: undefined, model: undefined };
		}

		const firstEnabledProvider = providers.find((p) => p.enabled && p.models.length > 0);
		if (!firstEnabledProvider) {
			return { provider: undefined, model: undefined };
		}

		const firstEnabledModel = firstEnabledProvider.models.find((m) => m.enabled);
		if (!firstEnabledModel) {
			return { provider: undefined, model: undefined };
		}

		return {
			provider: firstEnabledProvider.id,
			model: firstEnabledModel.id,
		};
	}, [providers]);

	// Reset chat state when user authentication changes
	useEffect(() => {
		const currentUserId = user?.id || null;

		// If user authentication state changed, reset chat state
		// This handles login, logout, and account switching
		if (lastUserId !== currentUserId) {
			// Always reset when user changes, including first login
			setCurrentChatId(null);
			setIsChatIdValidated(false);
			setIsInitialLoadComplete(false);

			setLastUserId(currentUserId);
		}
	}, [user?.id]);

	// Handle initialChatId changes (e.g., when navigating to different chat URLs)
	useEffect(() => {
		if (initialChatId !== lastInitialChatId) {
			setCurrentChatId(initialChatId || null);
			setIsChatIdValidated(false);
			setIsInitialLoadComplete(false);
			setLastInitialChatId(initialChatId);
		}
	}, [initialChatId, lastInitialChatId]);

	// Fetch chats using chatService.getChats - always fetch, let server handle auth
	const {
		data: chatsData,
		error: chatsError,
		isLoading: isLoadingChats,
		mutate: chatsMutate,
	} = chatService.getChats.swr("chats"); // Track when initial auth and data loading is complete
	useEffect(() => {
		if (!authLoading && !isLoadingChats && !isInitialLoadComplete) {
			setIsInitialLoadComplete(true);
		}
	}, [authLoading, isLoadingChats, isInitialLoadComplete]);
	// Fetch current chat details using chatService.getChatById
	// Only fetch if chatId has been validated against the chats list OR initial load is complete
	const {
		data: currentChatData,
		error: currentChatError,
		mutate: currentChatMutate,
	} = chatService.getChatById.swr(
		currentChatId && (isChatIdValidated || isInitialLoadComplete) ? `chat-${currentChatId}` : null,
		{
			id: currentChatId || "",
		},
	);

	// API mutations using chatService methods
	const { trigger: createChatTrigger } = chatService.createChat.swrMutation("create-chat");
	const { trigger: deleteChatTrigger } = chatService.deleteChat.swrMutation("delete-chat");
	const { trigger: updateChatTrigger } = chatService.updateChat.swrMutation("update-chat");
	const { trigger: sendMessageTrigger } = chatService.createMessage.swrMutation("send-message");
	// Transform API data to local format
	const chats = useMemo(() => {
		// Return empty array if no data
		if (!chatsData) return [];

		return chatsData; // Keep original server format, let components handle date conversion
	}, [chatsData]); // Validate currentChatId exists in chats list when chats data is loaded
	useEffect(() => {
		// Only validate if we have a currentChatId, data loading is complete,
		// and we actually have some chats data to validate against
		if (currentChatId && !isLoadingChats && chatsData && chats.length > 0) {
			const chatExists = chats.some((chat) => chat.id === currentChatId);

			if (!chatExists) {
				// Don't clear currentChatId immediately if it was just set and marked as validated
				// This handles the case where we just created a new chat but the list hasn't updated yet
				if (!isChatIdValidated) {
					setCurrentChatId(null);
					setIsChatIdValidated(false);
				}
			} else {
				setIsChatIdValidated(true); // Mark as validated
			}
		} else if (currentChatId && !isLoadingChats && chatsData && chats.length === 0) {
			// If user has no chats at all, clear the selection
			// But only if the chat ID hasn't been validated (i.e., it's not a newly created chat)
			if (!isChatIdValidated) {
				setCurrentChatId(null);
				setIsChatIdValidated(false);
			}
		}
	}, [currentChatId, isLoadingChats, chatsData, chats, isChatIdValidated]);
	// Transform current chat data
	const currentChat = useMemo(() => {
		if (!currentChatData || !currentChatId) return undefined;

		return currentChatData; // Keep original server format, let components handle date conversion
	}, [currentChatData, currentChatId]);
	const createNewChat = useCallback(async () => {
		try {
			// Use selected provider/model or fall back to first available
			let provider = selectedProvider;
			let model = selectedModel;

			if (!provider || !model) {
				const defaultConfig = getDefaultProviderAndModel();
				provider = defaultConfig.provider;
				model = defaultConfig.model;
			}

			// Validate that we have a provider and model
			if (!provider || !model) {
				throw new Error(t("chat.error.createChat", "Failed to create chat - no available AI models"));
			}

			const result = await createChatTrigger({
				title: t("chat.newChatTitle"),
				provider,
				model,
				imageCount: 1, // Default image count for new chat
			});

			if (result?.id) {
				// Revalidate chats list first to ensure the new chat appears in the list
				await chatsMutate();

				// Then set the new chat as current and mark as validated
				setCurrentChatId(result.id);
				setIsChatIdValidated(true);

				return result.id;
			}
		} catch (error) {
			console.error("Error creating chat:", error);
			throw error; // Re-throw to let caller handle
		}
		return null;
	}, [createChatTrigger, chatsMutate, selectedProvider, selectedModel, getDefaultProviderAndModel, t]);
	const deleteChat = useCallback(
		async (chatId: string) => {
			try {
				await deleteChatTrigger({ id: chatId });

				// If we deleted the current chat, clear the selection
				if (currentChatId === chatId) {
					setCurrentChatId(null);
				}

				// Revalidate chats list
				chatsMutate();
			} catch (error) {
				console.error("Error deleting chat:", error);
			}
		},
		[currentChatId, deleteChatTrigger, chatsMutate],
	);

	const updateChat = useCallback(
		async (chatId: string, updates: { provider?: string; model?: string; title?: string }) => {
			try {
				await updateChatTrigger({ id: chatId, ...updates });

				// Revalidate chats list and current chat if it's the one being updated
				chatsMutate();
				if (currentChatId === chatId) {
					currentChatMutate();
				}
			} catch (error) {
				console.error("Error updating chat:", error);
			}
		},
		[currentChatId, updateChatTrigger, chatsMutate, currentChatMutate],
	);

	const sendMessage = useCallback(
		async (
			content: string,
			imageFiles?: File[],
			targetChatId?: string,
			imageCount?: number,
			aspectRatio?: AspectRatio,
		): Promise<string | null> => {
			const chatId = targetChatId || currentChatId;

			// Convert image files to attachments with base64 data
			let attachments: Array<{ data: string; type: "image" }> | undefined;
			let images: string[] | undefined; // Keep for backward compatibility

			if (imageFiles && imageFiles.length > 0) {
				const base64Images = await Promise.all(
					imageFiles.map((file) => {
						return new Promise<string>((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => {
								if (typeof reader.result === "string") {
									resolve(reader.result);
								} else {
									reject(new Error("Failed to read file as base64"));
								}
							};
							reader.onerror = () => reject(reader.error);
							reader.readAsDataURL(file);
						});
					}),
				);

				// Create attachments array
				attachments = base64Images.map((data) => ({ data, type: "image" as const }));

				// Keep images for backward compatibility
				images = base64Images;
			}

			// If no chat is selected, create a new one with content and images
			if (!chatId) {
				try {
					// Use selected provider/model or fall back to first available
					let provider = selectedProvider;
					let model = selectedModel;

					if (!provider || !model) {
						const defaultConfig = getDefaultProviderAndModel();
						provider = defaultConfig.provider;
						model = defaultConfig.model;
					}

					// Validate that we have a provider and model
					if (!provider || !model) {
						throw new Error(t("chat.error.noModel", "No available AI models - please configure providers first"));
					}

					const result = await createChatTrigger({
						title: t("chat.newChatTitle"),
						provider,
						model,
						content,
						attachments,
						images, // Keep for backward compatibility
						imageCount: imageCount || 1, // Pass the image count
						aspectRatio, // Pass the aspect ratio
					});

					if (!result?.id) {
						throw new Error(t("chat.error.createNewChat"));
					}

					// Revalidate chats list first to ensure the new chat appears in the list
					await chatsMutate();

					// Then set the new chat as current and mark as validated
					setCurrentChatId(result.id);
					setIsChatIdValidated(true);

					// Return the chat ID - no need to send another message since createChat already handled it
					return result.id;
				} catch (error) {
					console.error("Error creating chat with content:", error);
					throw error;
				}
			}

			// Create optimistic user message matching server message structure
			const now = new Date().toISOString();
			const optimisticUserMessage = {
				id: `temp-user-${Date.now()}`, // Temporary ID
				createdAt: now,
				updatedAt: now,
				userId: user?.id || guestUser.id, // Use real user ID or fallback to mock
				chatId: chatId,
				content,
				role: "user" as const,
				type: "text" as const,
				generationId: null,
				metadata: null,
				generation: null,
				// Include attachments in optimistic message for immediate display
				// Match server response structure: { id, type, url }
				attachments: attachments
					? attachments.map((attachment, index) => ({
							id: `temp-attachment-${Date.now()}-${index}`,
							type: attachment.type,
							url: attachment.data,
						}))
					: [],
			};

			// For new chats, we need to initialize the chat data optimistically
			// First, force revalidation to ensure we're using the correct cache key
			if (chatId !== currentChatId) {
				await new Promise((resolve) => setTimeout(resolve, 100)); // Allow state to settle
			}

			currentChatMutate((currentData) => {
				// Get current chat data to extract provider and model
				const currentChatForMessage = chats.find((chat) => chat.id === chatId) || currentChat;
				let provider = currentChatForMessage?.provider || selectedProvider;
				let model = currentChatForMessage?.model || selectedModel;

				// Use default if not available
				if (!provider || !model) {
					const defaultConfig = getDefaultProviderAndModel();
					provider = provider || defaultConfig.provider;
					model = model || defaultConfig.model;
				}

				// If no current data (new chat), create initial structure
				if (!currentData) {
					return {
						id: chatId,
						title: t("chat.newChat"),
						provider: provider!,
						model: model!,
						createdAt: now,
						updatedAt: now,
						userId: user?.id || guestUser.id,
						deleted: null,
						messages: [optimisticUserMessage],
					};
				}

				// Otherwise, add the message to existing chat
				return {
					...currentData,
					messages: [...(currentData.messages || []), optimisticUserMessage],
					updatedAt: now,
				};
			}, false); // false = don't revalidate immediately

			setIsGenerating(true);

			try {
				// Get current chat data to extract provider and model
				const currentChatForMessage = chats.find((chat) => chat.id === chatId) || currentChat;
				let provider = currentChatForMessage?.provider || selectedProvider;
				let model = currentChatForMessage?.model || selectedModel;

				// Use default if not available
				if (!provider || !model) {
					const defaultConfig = getDefaultProviderAndModel();
					provider = provider || defaultConfig.provider;
					model = model || defaultConfig.model;
				}

				// Validate provider and model
				if (!provider || !model) {
					throw new Error(t("chat.error.noModel", "No available AI models - please configure providers first"));
				}

				const result = await sendMessageTrigger({
					chatId,
					content,
					provider,
					model,
					type: "text",
					attachments,
					images, // Keep for backward compatibility
					imageCount: imageCount || 1, // Pass the image count
					aspectRatio, // Pass the aspect ratio
				});

				// Use returned messages to update the chat data instead of revalidating
				if (result?.messages) {
					currentChatMutate((currentData) => {
						if (!currentData) return currentData;

						// Server returns only new messages, append to existing
						// Remove the optimistic user message first (it will be replaced by the server version)
						const existingMessages =
							currentData.messages?.filter((msg: any) => msg.id !== optimisticUserMessage.id) || [];

						// Append new messages from server
						return {
							...currentData,
							messages: [...existingMessages, ...result.messages],
							updatedAt: new Date().toISOString(),
						};
					}, false);
				} else {
					// Fallback: revalidate if no messages returned
					await currentChatMutate();
				}
			} catch (error) {
				console.error("Error sending message:", error);

				// On error, remove the optimistic message
				currentChatMutate((currentData) => {
					if (!currentData) return currentData;

					return {
						...currentData,
						messages: currentData.messages?.filter((msg: any) => msg.id !== optimisticUserMessage.id) || [],
					};
				}, false);
			} finally {
				setIsGenerating(false);
			}

			// Return the chat ID to caller
			return chatId;
		},
		[
			currentChatId,
			sendMessageTrigger,
			currentChatMutate,
			createNewChat,
			chatsMutate,
			chats,
			currentChat,
			user,
			selectedProvider,
			selectedModel,
			getDefaultProviderAndModel,
			t,
		],
	);
	const switchChat = useCallback((chatId: string) => {
		setCurrentChatId(chatId);
		setIsChatIdValidated(true); // Mark as validated since we're switching to an existing chat
	}, []);

	const clearChat = useCallback(() => {
		setCurrentChatId(null);
		setIsChatIdValidated(true); // Mark as validated since we're explicitly clearing
	}, []);

	const updateMessage = useCallback(
		(messageId: string, updates: Partial<ChatData["messages"][0]>) => {
			currentChatMutate((currentData) => {
				if (!currentData) return currentData;

				return {
					...currentData,
					messages: currentData.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
				};
			}, false);
		},
		[currentChatMutate],
	);

	// Delete message functionality
	const deleteMessage = useCallback(
		async (messageId: string) => {
			if (!currentChatId) return;

			try {
				// Optimistically remove the message from UI
				currentChatMutate((currentData) => {
					if (!currentData) return currentData;

					return {
						...currentData,
						messages: currentData.messages.filter((msg) => msg.id !== messageId),
					};
				}, false);

				// Call the API to delete from server
				await chatService.deleteMessage({ messageId });

				// Revalidate chat data to ensure consistency
				await currentChatMutate();
			} catch (error) {
				// Revert the optimistic update on error
				await currentChatMutate();
				throw error;
			}
		},
		[currentChatId, currentChatMutate, chatService],
	);

	// Regenerate message functionality
	const regenerateMessage = useCallback(
		async (messageId: string) => {
			if (!currentChatId) return;

			try {
				setIsGenerating(true);

				// Optimistically update the message status to show generating state
				// Use currentChatMutate to get the latest data and update it
				currentChatMutate((currentData) => {
					if (!currentData) return currentData;

					return {
						...currentData,
						messages: currentData.messages.map((msg) => {
							if (msg.id === messageId && msg.generation) {
								return {
									...msg,
									generation: {
										...msg.generation,
										status: "pending" as const,
										fileIds: null,
										errorReason: null,
									},
								};
							}
							return msg;
						}),
					};
				}, false);

				// Call the API
				await chatService.regenerateMessage({ messageId });

				// The polling mechanism in ChatMessageItem will handle updating the UI
			} catch (error) {
				console.error("Failed to regenerate message:", error);
				// Revert to failed state on error
				currentChatMutate((currentData) => {
					if (!currentData) return currentData;

					return {
						...currentData,
						messages: currentData.messages.map((msg) => {
							if (msg.id === messageId && msg.generation) {
								return {
									...msg,
									generation: {
										...msg.generation,
										status: "failed" as const,
										errorReason: "UNKNOWN",
									},
								};
							}
							return msg;
						}),
					};
				}, false);
			} finally {
				setIsGenerating(false);
			}
		},
		[chatService, currentChatId, currentChatMutate],
	);

	// Transform user data to match the expected format
	const transformedUser = useMemo(() => {
		if (!user) return guestUser; // Fallback to mock user if not authenticated

		return {
			id: user.id,
			nickname: user.name || t("user.defaultName"),
			avatar: user.image || undefined,
		};
	}, [user]);

	return {
		chats,
		currentChat,
		currentChatId,
		isGenerating,
		user: transformedUser,
		isLoading: isLoadingChats,
		error: chatsError || currentChatError,
		createNewChat,
		deleteChat,
		updateChat,
		sendMessage,
		switchChat,
		clearChat,
		updateMessage,
		deleteMessage,
		regenerateMessage,
	};
};
