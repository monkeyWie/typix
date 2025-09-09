import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ImagePreview, type ImageSlide } from "@/app/components/ui/image-preview";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useChatService } from "@/app/hooks/useService";
import { cn } from "@/app/lib/utils";
import type { chatService } from "@/server/service/chat";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GenerationErrorItem } from "./GenerationErrorItem";
import { MessageActions } from "./MessageActions";

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
	onDelete?: (messageId: string) => void; // Add delete callback
}

export function ChatMessageItem({
	message,
	user,
	allMessages,
	onMessageUpdate,
	onRetry,
	onDelete,
}: ChatMessageItemProps) {
	const { t } = useTranslation();
	const chatService = useChatService();
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const skipPoll = useRef<boolean>(false);
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const isUser = message.role === "user";

	// Get user message attachments
	const userAttachments = message.attachments || [];

	// Get all images from the chat (including user attachments and AI generations)
	const allImages: ImageSlide[] = (allMessages || []).flatMap((msg) => {
		const images: ImageSlide[] = [];

		// Add user attachments
		if (msg.attachments) {
			for (const attachment of msg.attachments) {
				if (attachment.type === "image" && attachment.url) {
					images.push({
						src: attachment.url,
						title: t("chat.userImage"),
					});
				}
			}
		}

		// Add AI generated images
		if (msg.type === "image" && msg.generation?.resultUrls && msg.generation?.status === "completed") {
			const urls = msg.generation!.resultUrls;
			// Handle both string and array formats
			const imageUrls = typeof urls === "string" ? [urls] : (urls as string[]);
			for (const url of imageUrls) {
				images.push({
					src: url,
					title: msg.content || t("chat.generatedImage"),
				});
			}
		}

		return images;
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
			className={cn("group flex gap-4 p-6 transition-all duration-200", isUser && "flex-row-reverse")}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
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
						<>
							<AvatarImage src="/logo.png" alt={t("chat.ai")} />
							<AvatarFallback className="bg-gradient-to-br from-muted-foreground to-muted-foreground/80 text-background">
								<span className="font-bold text-sm">{t("chat.ai")}</span>
							</AvatarFallback>
						</>
					)}
				</Avatar>
			</div>

			{/* Message Content */}
			<div className={cn("min-w-0", message.type === "image" && !message.content ? "" : "flex-1")}>
				{/* Message Header - positioned above the message box */}
				<div className={cn("mb-1 flex items-center gap-2 text-muted-foreground text-xs", isUser && "flex-row-reverse")}>
					<span className="opacity-70">{formatTime(displayTime)}</span>
				</div>

				{/* Message Body - aligned with avatar top */}
				<div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
					{/* User attachments - displayed above the text message */}
					{isUser && userAttachments.length > 0 && (
						<div className={cn("mb-2", isUser ? "flex justify-end" : "flex justify-start")}>
							<div className="w-full max-w-2xl">
								{userAttachments.length === 1 ? (
									<div className="flex justify-center">
										<button
											type="button"
											className="block rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
											onClick={() => {
												if (userAttachments[0]?.url && allImages.length > 0) {
													const imageIndex = allImages.findIndex((img) => img.src === userAttachments[0]?.url);
													setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
													setIsLightboxOpen(true);
												}
											}}
											aria-label={t("chat.clickToEnlarge")}
											disabled={!userAttachments[0]?.url}
										>
											<img
												src={userAttachments[0]?.url || ""}
												alt={t("chat.userImage")}
												className="h-auto w-full max-w-sm rounded-xl object-cover shadow-lg sm:max-w-md md:max-w-lg"
												loading="lazy"
											/>
										</button>
									</div>
								) : (
									<div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
										{userAttachments.map((attachment, index) => (
											<button
												key={`${message.id}-attachment-${attachment.id}`}
												type="button"
												className="block rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
												onClick={() => {
													if (attachment.url && allImages.length > 0) {
														const imageIndex = allImages.findIndex((img) => img.src === attachment.url);
														setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
														setIsLightboxOpen(true);
													}
												}}
												aria-label={t("chat.clickToEnlarge")}
												disabled={!attachment.url}
											>
												<img
													src={attachment.url || ""}
													alt={t("chat.userImage")}
													className="aspect-square h-auto w-full rounded-xl object-cover shadow-lg"
													loading="lazy"
												/>
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* Text message card container - separate from attachments to maintain independent width */}
					{(message.content || isMessageGenerating || isMessageFailed) && (
						<div className={cn("relative", isUser ? "flex justify-end" : "flex justify-start")}>
							{/* Message Actions - positioned near the message card */}
							{isHovered && !isMessageGenerating && (
								<MessageActions
									messageId={message.id}
									messageType={message.type}
									content={message.content}
									imageUrls={
										isUser
											? (userAttachments.map((att) => att.url).filter(Boolean) as string[])
											: currentMessageImageUrls
									}
									isUser={isUser}
									onDelete={onDelete}
									className={cn(
										"absolute top-1 z-10",
										// Desktop positioning
										isUser ? "sm:-left-2 sm:-translate-x-full" : "sm:-right-2 sm:translate-x-full",
										// Mobile positioning - show inside content area
										isUser ? "right-2 sm:right-auto" : "left-2 sm:left-auto",
									)}
								/>
							)}

							<div
								className={cn(
									"max-w-2xl rounded-xl border border-border/50 bg-card/80 p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md",
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
										{/* Text content */}
										{message.content && (
											<p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
										)}
									</>
								)}
							</div>
						</div>
					)}

					{/* Display AI generated images - no background/border wrapper, same as attachments */}
					{message.type === "image" && currentMessageImageUrls.length > 0 && (
						<div className={cn("mt-2", isUser ? "flex justify-end" : "flex justify-start")}>
							<div className="w-full max-w-2xl">
								{currentMessageImageUrls.length === 1 ? (
									<div className="flex justify-center">
										<div className="relative">
											{/* Message Actions for single image */}
											{isHovered && (
												<MessageActions
													messageId={message.id}
													messageType={message.type}
													content={message.content}
													imageUrls={currentMessageImageUrls}
													isUser={isUser}
													onDelete={onDelete}
													className={cn(
														"absolute top-1 z-10",
														// Desktop positioning
														isUser ? "sm:-left-2 sm:-translate-x-full" : "sm:-right-2 sm:translate-x-full",
														// Mobile positioning - show inside content area
														isUser ? "right-2 sm:right-auto" : "left-2 sm:left-auto",
													)}
												/>
											)}
											<button
												type="button"
												className="block rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
												onClick={() => {
													if (isCurrentImageSuccessful && allImages.length > 0) {
														const imageIndex = allImages.findIndex((img) => img.src === currentMessageImageUrls[0]);
														setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
														setIsLightboxOpen(true);
													}
												}}
												aria-label={t("chat.clickToEnlarge")}
												disabled={!isCurrentImageSuccessful}
											>
												<img
													src={currentMessageImageUrls[0]}
													alt={t("chat.generatedOrUploaded")}
													className="h-auto w-full max-w-sm rounded-xl object-cover shadow-lg sm:max-w-md md:max-w-lg"
													loading="lazy"
												/>
											</button>
										</div>
									</div>
								) : (
									<div className="relative">
										{/* Message Actions for multiple images */}
										{isHovered && (
											<MessageActions
												messageId={message.id}
												messageType={message.type}
												content={message.content}
												imageUrls={currentMessageImageUrls}
												isUser={isUser}
												onDelete={onDelete}
												className={cn(
													"-top-2 absolute z-10",
													// Desktop positioning
													isUser ? "sm:-left-2 sm:-translate-x-full" : "sm:-right-2 sm:translate-x-full",
													// Mobile positioning - show inside content area
													isUser ? "right-2 sm:right-auto" : "left-2 sm:left-auto",
												)}
											/>
										)}
										<div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
											{currentMessageImageUrls.map((imageUrl, index) => (
												<button
													key={`${message.id}-${imageUrl}-${index}`}
													type="button"
													className="block rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
													onClick={() => {
														if (isCurrentImageSuccessful && allImages.length > 0) {
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
														className="aspect-square h-auto w-full rounded-xl object-cover shadow-lg"
														loading="lazy"
													/>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Image Preview for all images */}
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
			</div>
		</div>
	);
}
