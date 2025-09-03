import { useAuth } from "@/app/hooks/useAuth";
import { useAiService } from "@/app/hooks/useService";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/app/lib/utils";
import { ChatArea, type ChatAreaRef } from "@/app/routes/chat/-components/chat/ChatArea";
import { ChatInput } from "@/app/routes/chat/-components/chat/ChatInput";
import { ChatSidebar } from "@/app/routes/chat/-components/sidebar/ChatSidebar";
import { useChat } from "@/app/routes/chat/-hooks/useChat";
import { ChatSidebarProvider, useSidebar } from "@/app/routes/chat/-hooks/useChatSidebar";
import type { AspectRatio } from "@/server/ai/types/api";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export const Route = createFileRoute("/chat/")({
	component: ChatPage,
	validateSearch: z.object({
		chatId: z.string().optional(),
	}),
});

function ChatPage() {
	return (
		<ChatSidebarProvider>
			<ChatPageContent />
		</ChatSidebarProvider>
	);
}

function ChatPageContent() {
	const { chatId } = Route.useSearch();
	const navigate = Route.useNavigate();
	const chatAreaRef = useRef<ChatAreaRef>(null);
	const { toast } = useToast();
	const { t } = useTranslation();
	const aiService = useAiService();

	// Local state for model selection when no chat is selected
	const [selectedProvider, setSelectedProvider] = useState<string | undefined>();
	const [selectedModel, setSelectedModel] = useState<string | undefined>();

	// Get available providers for auto-selection
	const { data: providers } = aiService.getEnabledAiProvidersWithModels.swr("ai-providers-with-models");

	const {
		chats,
		currentChat,
		currentChatId,
		isGenerating,
		user: chatUser,
		isLoading,
		error,
		createNewChat,
		sendMessage,
		switchChat,
		clearChat,
		deleteChat,
		updateChat,
		updateMessage,
		deleteMessage,
		regenerateMessage,
	} = useChat(chatId, selectedProvider, selectedModel);

	// Auto-select first available model for new chats only
	useEffect(() => {
		// If we have a chatId (existing chat), clear the selected provider/model
		// to prevent interference with the existing chat's configuration
		if (chatId) {
			setSelectedProvider(undefined);
			setSelectedModel(undefined);
			return;
		}

		// Only auto-select if:
		// 1. No chat is currently selected in URL (truly new chat)
		// 2. No model is currently selected
		// 3. No existing chat is loaded (currentChat is null/undefined)
		// 4. Not currently loading (to avoid interfering with existing chat loading)
		// 5. Providers are available
		if (
			!chatId &&
			!selectedProvider &&
			!selectedModel &&
			!currentChat &&
			!isLoading &&
			providers &&
			providers.length > 0
		) {
			const firstEnabledProvider = providers.find((p) => p.enabled && p.models.length > 0);
			if (firstEnabledProvider) {
				const firstEnabledModel = firstEnabledProvider.models.find((m) => m.enabled);
				if (firstEnabledModel) {
					setSelectedProvider(firstEnabledProvider.id);
					setSelectedModel(firstEnabledModel.id);
				}
			}
		}
	}, [chatId, selectedProvider, selectedModel, currentChat, isLoading, providers]);
	const { isOpen, isMobile } = useSidebar();

	// Handle chat switching with URL update
	const handleSwitchChat = (newChatId: string) => {
		switchChat(newChatId);
		navigate({
			search: { chatId: newChatId },
			replace: true, // Use replace to avoid cluttering browser history
		});
	};
	// Handle chat creation with URL update
	const handleCreateChat = async () => {
		try {
			const newChatId = await createNewChat();
			if (newChatId) {
				// Switch to the new chat explicitly to ensure it's selected
				switchChat(newChatId);
				navigate({
					search: { chatId: newChatId },
					replace: true,
				});
			}
		} catch (error) {
			console.error("Error creating chat:", error);

			// Show toast notification for user
			toast({
				title: t("chat.error.title", "Error"),
				description:
					error instanceof Error
						? error.message
						: t("chat.error.createChat", "Failed to create chat - please select a provider and model"),
				variant: "destructive",
			});
		}
	};

	// Handle chat deletion with URL cleanup
	const handleDeleteChat = async (chatIdToDelete: string) => {
		await deleteChat(chatIdToDelete);

		// If we deleted the current chat, clear the URL parameter
		if (currentChatId === chatIdToDelete) {
			navigate({
				search: {},
				replace: true,
			});
		}
	};
	const handleSendMessage = async (
		content: string,
		imageFiles?: File[],
		imageCount?: number,
		aspectRatio?: AspectRatio,
	) => {
		try {
			// Execute sendMessage and wait for completion
			await sendMessage(content, imageFiles, undefined, imageCount, aspectRatio);
		} catch (error) {
			console.error("Error sending message:", error);

			// Show toast notification for user
			toast({
				title: t("chat.error.title", "Error"),
				description:
					error instanceof Error
						? error.message
						: t("chat.error.default", "An error occurred while sending the message"),
				variant: "destructive",
			});

			return; // Don't scroll if there was an error
		}

		// Trigger scroll immediately after sending (optimistic scroll)
		// This ensures smooth UX as the optimistic message appears
		setTimeout(() => {
			chatAreaRef.current?.triggerScroll();
		}, 100); // Small delay to ensure optimistic message is rendered
	};

	const handleModelChange = (provider: string, model: string) => {
		if (currentChatId) {
			// Update existing chat
			updateChat(currentChatId, { provider, model });
		} else {
			// No current chat, store selection for when new chat is created
			setSelectedProvider(provider);
			setSelectedModel(model);
		}
	};

	return (
		<div className="flex h-full">
			{" "}
			{/* Chat Sidebar - Fixed positioning, will handle its own layout */}
			<ChatSidebar
				chats={chats}
				currentChatId={currentChatId}
				user={chatUser}
				onCreateChat={handleCreateChat}
				onSwitchChat={handleSwitchChat}
				onDeleteChat={handleDeleteChat}
			/>
			{/* Main chat content area - margin adjustment for slide animation */}
			<div
				className={cn(
					"flex flex-1 flex-col transition-[margin-left] duration-300 ease-in-out",
					// Desktop: Margin calculation based on sidebar slide state
					// When expanded: GlobalNavigation (16px) + ChatSidebar (320px) = 336px
					// When collapsed: Only GlobalNavigation (16px), sidebar is completely hidden
					!isMobile && isOpen && "md:ml-96", // 16 + 320 = 336px, use ml-96 for 24rem
					!isMobile && !isOpen && "md:ml-16", // Only GlobalNavigation width: 16px = 4rem
					// Mobile: No margin, sidebar is overlay
					isMobile && "ml-0",
				)}
			>
				{" "}
				{/* Chat Area */}
				<ChatArea
					ref={chatAreaRef}
					chat={currentChat || null}
					user={chatUser}
					isGenerating={isGenerating}
					onCreateChat={handleCreateChat}
					onModelChange={handleModelChange}
					onMessageUpdate={updateMessage}
					onRetry={regenerateMessage}
					onDeleteMessage={deleteMessage}
					// Pass selected provider/model for when there's no current chat
					fallbackProvider={selectedProvider}
					fallbackModel={selectedModel}
				/>
				{/* Chat Input */}
				<ChatInput
					onSendMessage={handleSendMessage}
					disabled={isGenerating}
					currentProvider={currentChat?.provider || selectedProvider}
					currentModel={currentChat?.model || selectedModel}
				/>
			</div>
		</div>
	);
}
