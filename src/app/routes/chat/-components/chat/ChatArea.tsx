import { ScrollArea } from "@/app/components/ui/scroll-area";
import type { chatService } from "@/server/service/chat";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../-hooks/useChatSidebar";
import { ChatSidebarTrigger } from "../sidebar/ChatSidebarTrigger";
import { ChatMessageItem } from "./ChatMessageItem";
import { ModelBadge } from "./ModelBadge";

// Type inference from service functions
type ChatData = NonNullable<Awaited<ReturnType<typeof chatService.getChatById>>>;

type User = {
	id: string;
	nickname: string;
	avatar?: string;
};

interface ChatAreaProps {
	chat: ChatData | null;
	user: User;
	isGenerating: boolean;
	onCreateChat?: () => void;
	onModelChange?: (provider: string, model: string) => void;
	onMessageUpdate?: (messageId: string, updates: Partial<ChatData["messages"][0]>) => void;
	onRetry?: (messageId: string) => Promise<void>;
	onDeleteMessage?: (messageId: string) => Promise<void>;
	// Fallback values when there's no current chat
	fallbackProvider?: string;
	fallbackModel?: string;
}

export interface ChatAreaRef {
	triggerScroll: () => void;
}

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
	(
		{
			chat,
			user,
			isGenerating,
			onCreateChat,
			onModelChange,
			onMessageUpdate,
			onRetry,
			onDeleteMessage,
			fallbackProvider,
			fallbackModel,
		},
		ref,
	) => {
		const { t } = useTranslation();
		const { isMobile } = useSidebar();
		const scrollAreaRef = useRef<HTMLDivElement>(null);
		const messagesContainerRef = useRef<HTMLDivElement>(null);
		const latestMessageRef = useRef<HTMLDivElement>(null);
		const [previousMessageCount, setPreviousMessageCount] = useState(0);
		const [previousChatId, setPreviousChatId] = useState<string | null>(null);

		// Extract scroll logic into a reusable function
		const performScrollAdjustment = useCallback((smooth = false) => {
			if (scrollAreaRef.current) {
				const scrollContainer =
					(scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement) ||
					(scrollAreaRef.current.querySelector("[data-slot=scroll-area-viewport]") as HTMLElement);

				if (scrollContainer) {
					if (smooth) {
						// Smooth scrolling for new messages
						scrollContainer.scrollTo({
							top: scrollContainer.scrollHeight,
							behavior: "smooth",
						});
					} else {
						// Instant scrolling for initial load
						const scrollToBottom = () => {
							scrollContainer.scrollTop = scrollContainer.scrollHeight;
						};

						// Execute immediately, then on next frame, then after layout
						scrollToBottom();
						requestAnimationFrame(() => {
							scrollToBottom();
							requestAnimationFrame(scrollToBottom);
						});
					}
				}
			}
		}, []);
		// Expose triggerScroll method to parent
		useImperativeHandle(
			ref,
			() => ({
				triggerScroll: (smooth = true) => {
					performScrollAdjustment(smooth);
				},
			}),
			[performScrollAdjustment],
		); // Auto-scroll to bottom when messages change or chat changes
		useEffect(() => {
			const currentMessageCount = chat?.messages?.length || 0;
			const currentChatId = chat?.id || null;

			// Check if chat has changed
			const isChatChanged = previousChatId !== currentChatId;

			if (currentMessageCount > 0) {
				if (previousMessageCount === 0 || isChatChanged) {
					// Initial load or chat change - instant scroll without smooth animation
					setTimeout(() => performScrollAdjustment(false), 100);
				} else {
					// New message in same chat - smooth scroll immediately
					performScrollAdjustment(true);
				}
			}

			setPreviousMessageCount(currentMessageCount);
			setPreviousChatId(currentChatId);
		}, [chat?.messages?.length, chat?.id, previousMessageCount, previousChatId, performScrollAdjustment]);
		// Listen for image load events to adjust scroll position
		useEffect(() => {
			if (messagesContainerRef.current) {
				const container = messagesContainerRef.current;

				const handleImageLoad = () => {
					// Smooth scroll when image loads (unless it's initial load or chat change)
					const isInitialLoad = previousMessageCount === 0;
					const isChatChanged = previousChatId !== (chat?.id || null);
					setTimeout(() => performScrollAdjustment(!isInitialLoad && !isChatChanged), 100);
				};

				// Add event listener for all images
				container.addEventListener("load", handleImageLoad, true);

				return () => {
					container.removeEventListener("load", handleImageLoad, true);
				};
			}
		}, [performScrollAdjustment, previousMessageCount, previousChatId, chat?.id]);
		// Show empty chat interface instead of welcome screen
		const displayChat = chat || {
			id: "temp",
			title: t("chat.newChatTitle"),
			messages: [],
			// For new chats, use fallback values; for loading existing chats, use empty strings
			// but don't trigger auto-selection since isNewChat will handle it
			provider: fallbackProvider || "",
			model: fallbackModel || "",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const handleModelChange = (provider: string, model: string) => {
			if (onModelChange) {
				onModelChange(provider, model);
			}
		};

		// Determine if this is a new chat (no real chat data)
		const isNewChat = !chat;

		return (
			<div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-background/80 to-background/60">
				{/* Chat Header with Glass Effect */}
				<div className="flex-shrink-0 border-border/50 border-b bg-background/80 p-4 backdrop-blur-md md:p-6">
					<div className="mx-auto w-full max-w-4xl px-4">
						<div className="flex items-center gap-3">
							{/* Mobile sidebar trigger - only show on mobile */}
							{isMobile && <ChatSidebarTrigger className="-ml-4 flex-shrink-0" />}
							{/* App Icon */}
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
								<span className="text-lg">🎨</span>
							</div>
							{/* Content area */}
							<div className="flex min-w-0 flex-1 items-center justify-between">
								<div className="min-w-0 flex-1">
									<h2 className="truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-lg text-transparent md:text-xl">
										{displayChat.title}
									</h2>
								</div>
								{/* Model Badge */}
								<ModelBadge
									currentProvider={displayChat.provider}
									currentModel={displayChat.model}
									onModelChange={handleModelChange}
									isNewChat={isNewChat}
								/>
							</div>
						</div>
					</div>
				</div>{" "}
				{/* Messages Container with proper scrolling */}
				<div className="min-h-0 flex-1 overflow-hidden">
					<ScrollArea ref={scrollAreaRef} className="h-full">
						<div className="mx-auto w-full max-w-4xl px-4">
							{displayChat.messages.length === 0 ? (
								<div className="flex h-96 items-center justify-center">
									<div className="max-w-md text-center">
										<div className="mb-6 flex justify-center">
											<div className="relative">
												<div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
													<span className="text-3xl">🎨</span>
												</div>
												<div className="-bottom-1 -right-1 absolute flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
													<span className="text-xs">✨</span>
												</div>
											</div>
										</div>
										<h3 className="mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-2xl text-transparent">
											{t("chat.generateImage")}
										</h3>
										<p className="max-w-sm text-muted-foreground leading-relaxed">{t("chat.welcomeMessage")}</p>
										<div className="mt-8 flex justify-center gap-2">
											<div className="h-1 w-8 animate-pulse rounded-full bg-primary/60" />
											<div className="h-1 w-4 animate-pulse rounded-full bg-primary/40 delay-75" />
											<div className="h-1 w-2 animate-pulse rounded-full bg-primary/20 delay-150" />
										</div>
									</div>
								</div>
							) : (
								<div ref={messagesContainerRef} className="space-y-0 py-6">
									{" "}
									{/* Messages in chronological order (oldest first, newest last) */}
									{displayChat.messages.map((message, index) => {
										const isLatestMessage = index === displayChat.messages.length - 1;
										return (
											<div key={message.id} ref={isLatestMessage ? latestMessageRef : undefined}>
												<ChatMessageItem
													message={message}
													user={user}
													allMessages={displayChat.messages}
													onMessageUpdate={onMessageUpdate}
													onRetry={onRetry}
													onDelete={onDeleteMessage}
												/>
											</div>
										);
									})}
									{/* No longer show separate generating indicator - rely on message status */}
								</div>
							)}

							{/* No longer need bottom reference */}
						</div>{" "}
					</ScrollArea>
				</div>
			</div>
		);
	},
);
