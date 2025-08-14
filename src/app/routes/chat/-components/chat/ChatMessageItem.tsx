import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card } from "@/app/components/ui/card";
import { ImagePreview, type ImageSlide } from "@/app/components/ui/image-preview";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useChatService } from "@/app/hooks/useService";
import { cn } from "@/app/lib/utils";
import type { chatService } from "@/server/service/chat";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GenerationErrorItem } from "./GenerationErrorItem";

// Type inference from service functions
type ChatData = NonNullable<Awaited<ReturnType<typeof chatService.getChatById>>>;
type ChatMessage = ChatData["messages"][0];

type User = {
	id: string;
	nickname: string;
	avatar?: string;
};

interface ChatMessageItemProps {
	message: ChatMessage;
	user: User;
	allMessages?: ChatMessage[]; // Add all messages to get all images
	onMessageUpdate?: (messageId: string, updates: Partial<ChatMessage>) => void;
	onRetry?: (messageId: string) => Promise<void>; // Add retry callback
}

export function ChatMessageItem({ message, user, allMessages, onMessageUpdate, onRetry }: ChatMessageItemProps) {
	const { t } = useTranslation();
	const chatService = useChatService();
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const skipPoll = useRef<boolean>(false);
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const isUser = message.role === "user"; // Get all images from the chat
	const allImages: ImageSlide[] = (allMessages || [])
		.filter((msg) => msg.type === "image" && msg.generation?.resultUrls && msg.generation?.status === "completed")
		.flatMap((msg) => {
			const urls = msg.generation!.resultUrls;
			// Handle both string and array formats
			const imageUrls = typeof urls === "string" ? [urls] : (urls as string[]);
			return imageUrls.map((url: string) => ({
				src: url,
				title: msg.content || t("chat.generatedImage"),
			}));
		});
	// Find current image index
	const currentImageUrls = message.generation?.resultUrls;
	const currentImageUrl = currentImageUrls
		? typeof currentImageUrls === "string"
			? currentImageUrls
			: (currentImageUrls as string[])[0]
		: undefined;
	const isCurrentImageSuccessful = message.generation?.status === "completed" && currentImageUrl;

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Transform server data for display
	const displayTime = (() => {
		const date = new Date(message.createdAt);
		// Check if date is valid
		if (Number.isNaN(date.getTime())) {
			// Fallback to current time if invalid
			return new Date();
		}
		return date;
	})();
	const isMessageGenerating = message.generation?.status === "pending" || message.generation?.status === "generating";
	const isMessageFailed = message.generation?.status === "failed";

	// Get current message's images for display
	const currentMessageImages = message.generation?.resultUrls;
	const currentMessageImageUrls = currentMessageImages
		? typeof currentMessageImages === "string"
			? [currentMessageImages]
			: (currentMessageImages as string[])
		: [];

	// Poll generation status for generating messages
	useEffect(() => {
		// Get generation ID from either message.generationId or message.generation?.id
		const generationId = message.generationId || message.generation?.id;

		if (isMessageGenerating && generationId && onMessageUpdate) {
			const pollStatus = async () => {
				try {
					if (skipPoll.current) {
						return;
					}

					const status = await chatService.getGenerationStatus({
						generationId: generationId!,
					});

					if (status) {
						// Update only the generation field
						onMessageUpdate(message.id, {
							generation: status,
						});

						// Stop polling if generation is complete or failed
						if (status.status === "completed" || status.status === "failed") {
							if (intervalRef.current) {
								clearInterval(intervalRef.current);
								intervalRef.current = null;
							}
						}
					}
				} catch (error) {
					console.error("Error polling generation status:", error);
				}
			};

			// Start polling every 3 seconds
			intervalRef.current = setInterval(pollStatus, 3000);

			// Also poll immediately (unless skipFirstPoll is set)
			pollStatus();

			// Cleanup on unmount or when generation is no longer pending
			return () => {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
			};
		}
	}, [isMessageGenerating, message.generationId, message.generation?.id, message.id, onMessageUpdate, chatService]);

	// Cleanup interval on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return (
		<div
			className={cn(
				"flex gap-4 p-6 transition-all duration-200 hover:bg-muted/30",
				isUser && "flex-row-reverse bg-gradient-to-l from-muted/20 to-transparent",
			)}
		>
			{/* Avatar */}
			<div className="flex-shrink-0">
				<Avatar
					className={cn(
						"mt-6 h-10 w-10 ring-2 transition-all duration-200",
						isUser ? "ring-primary/30" : "ring-muted-foreground/20",
					)}
				>
					{isUser ? (
						<>
							<AvatarImage src={user.avatar} alt={user.nickname} />
							<AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 font-medium text-primary-foreground">
								{user.nickname.charAt(0).toUpperCase()}
							</AvatarFallback>
						</>
					) : (
						<AvatarFallback className="bg-gradient-to-br from-muted-foreground to-muted-foreground/80 text-background">
							<span className="font-bold text-sm">{t("chat.ai")}</span>
						</AvatarFallback>
					)}
				</Avatar>
			</div>

			{/* Message Content */}
			<div className={cn("min-w-0 flex-1", isUser && "text-right")}>
				{/* Message Header - positioned above the message box */}
				<div className={cn("mb-1 flex items-center gap-2 text-muted-foreground text-xs", isUser && "flex-row-reverse")}>
					<span className="opacity-70">{formatTime(displayTime)}</span>
				</div>

				{/* Message Body - aligned with avatar top */}
				<div className={cn("flex", isUser && "justify-end")}>
					<Card
						className={cn(
							"max-w-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md",
							isUser
								? "border-primary/30 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
								: "border-border/50 bg-card/80 backdrop-blur-sm",
						)}
					>
						{isMessageGenerating && !isUser ? (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="flex space-x-1">
										<div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
										<div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-75" />
										<div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-150" />
									</div>
									<span className="text-muted-foreground text-xs">
										{message.type === "image" ? t("chat.generating") : t("chat.thinking")}
									</span>
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
								</div>
							</div>
						) : isMessageFailed && !isUser ? (
							<div className="space-y-3">
								{/* Show original prompt if available */}
								{message.content && (
									<p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
								)}
								{/* Show error card */}
								<GenerationErrorItem
									errorReason={message.generation?.errorReason || "UNKNOWN"}
									provider={message.generation?.provider}
									onRetry={async () => {
										skipPoll.current = true;
										try {
											// Call the retry callback with message ID
											await onRetry?.(message.id);
										} finally {
											skipPoll.current = false;
										}
									}}
								/>
							</div>
						) : (
							<>
								{message.content && (
									<p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
								)}{" "}
								{message.type === "image" && currentMessageImageUrls.length > 0 && (
									<div className="mt-3">
										<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
											{currentMessageImageUrls.map((imageUrl, index) => (
												<button
													key={`${message.id}-${imageUrl}`}
													type="button"
													className="block rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
													onClick={() => {
														// Only open preview if current image is successful
														if (isCurrentImageSuccessful && allImages.length > 0) {
															// Find the index of this specific image in allImages
															const imageIndex = allImages.findIndex((img) => img.src === imageUrl);
															setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
															setIsLightboxOpen(true);
														}
													}}
													aria-label={t("chat.clickToEnlarge")}
													disabled={!isCurrentImageSuccessful}
												>
													<img
														src={imageUrl}
														alt={t("chat.generatedOrUploaded")}
														className="h-auto max-h-96 max-w-full rounded-xl object-cover shadow-lg"
														loading="lazy"
													/>
												</button>
											))}
										</div>
										{/* Only render ImagePreview if there are successful images */}
										{allImages.length > 0 && (
											<ImagePreview
												open={isLightboxOpen}
												close={() => setIsLightboxOpen(false)}
												slides={allImages}
												index={currentImageIndex}
												onIndexChange={setCurrentImageIndex}
												plugins={{
													captions: false,
												}}
											/>
										)}
									</div>
								)}
							</>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
