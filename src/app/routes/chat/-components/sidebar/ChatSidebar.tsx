import { LoginButton } from "@/app/components/login/LoginButton";
import { UserMenu } from "@/app/components/navigation/UserMenu";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/app/lib/utils";
import { mode } from "@/server/lib/env";
import type { chatService } from "@/server/service/chat";
import { MoreVertical, Palette, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../-hooks/useChatSidebar";
import { ChatSidebarTrigger } from "./ChatSidebarTrigger";

// Type inference from service functions
type ChatList = Awaited<ReturnType<typeof chatService.getChats>>;
type ChatItem = ChatList[0];

type User = {
	id: string;
	nickname: string;
	avatar?: string;
};

interface ChatSidebarProps {
	chats: ChatItem[];
	currentChatId: string | null;
	user: User;
	onCreateChat: () => void;
	onSwitchChat: (chatId: string) => void;
	onDeleteChat: (chatId: string) => void;
}

export function ChatSidebar({
	chats,
	currentChatId,
	user,
	onCreateChat,
	onSwitchChat,
	onDeleteChat,
}: ChatSidebarProps) {
	const { t } = useTranslation();
	const { isOpen, toggle, setOpen, isMobile } = useSidebar();
	const { isLogin: isAuthenticated } = useAuth();

	// State to control when to show the expand button (after sidebar is fully hidden)
	const [showExpandButton, setShowExpandButton] = useState(!isOpen);

	// Handle expand button visibility with delay
	useEffect(() => {
		if (isOpen) {
			// Hide expand button immediately when sidebar starts opening
			setShowExpandButton(false);
		} else {
			// Show expand button after sidebar finishes closing (300ms transition)
			const timer = setTimeout(() => {
				setShowExpandButton(true);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);
	const formatDate = (date: Date) => {
		// Check if date is valid
		if (!date || Number.isNaN(date.getTime())) {
			return t("common.unknown");
		}

		const now = new Date();
		const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) {
			// Show time for today's chats
			return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		}
		if (diffInDays === 1) return t("common.yesterday");
		if (diffInDays < 7) return `${diffInDays} ${t("common.daysAgo")}`;
		return date.toLocaleDateString();
	};

	const closeSidebar = () => {
		setOpen(false);
	};
	const SidebarContent = () => (
		<div className="flex h-screen flex-col border-border/50 border-r bg-background">
			{/* TOP SECTION - Fixed height (Header + New Chat Button) */}
			<div className="flex-shrink-0">
				{/* Header */}
				<div className="flex h-16 items-center justify-between p-4">
					<div className="flex items-center gap-3">
						<h3 className="font-semibold text-lg">{t("chat.chatWith")}</h3>
					</div>
					{/* Close button for expanded state */}
					{!isMobile && (
						<ChatSidebarTrigger useDesktopIcons={true} className="h-8 w-8 transition-transform hover:scale-110" />
					)}
				</div>
				{/* New Chat Button */}{" "}
				<div className="h-20 p-4">
					<Button
						onClick={() => {
							onCreateChat();
						}}
						className="w-full justify-start gap-3 transition-all hover:scale-[1.02]"
						variant="default"
					>
						<Plus className="h-4 w-4" />
						<span>{t("chat.newChat")}</span>
					</Button>
				</div>
			</div>
			{/* MIDDLE SECTION - Flexible height (Chat List) */}
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{/* Section title */}
				<div className="flex h-10 flex-shrink-0 items-end px-4 pb-3">
					<h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
						{t("chat.chatHistory")}
					</h3>
				</div>
				{/* Scrollable chat list - takes remaining space */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full px-2">
						<div className="space-y-1 pr-2 pb-4">
							{chats.length === 0 ? (
								<div className="py-12 text-center">
									<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
										{/* <span className="text-xl">💭</span> */}
										<Palette />
									</div>
									<p className="text-muted-foreground text-sm">{t("chat.noChats")}</p>
								</div>
							) : (
								chats.map((chat) => (
									<div
										key={chat.id}
										className={cn(
											"group relative flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-accent/80",
											currentChatId === chat.id && "border border-accent-foreground/20 bg-accent shadow-sm",
										)}
										onClick={() => {
											onSwitchChat(chat.id);
											// Only close sidebar on mobile
											if (isMobile) {
												closeSidebar();
											}
										}}
										aria-label={`Switch to chat: ${chat.title}`}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onSwitchChat(chat.id);
												// Only close sidebar on mobile
												if (isMobile) {
													closeSidebar();
												}
											}
										}}
									>
										<Palette fill="none" />
										<div className="flex-1 overflow-hidden">
											<div className="truncate font-medium text-sm leading-5">{chat.title}</div>
											<div className="mt-0.5 text-muted-foreground text-xs">{formatDate(new Date(chat.updatedAt))}</div>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 opacity-0 transition-all duration-200 hover:bg-muted/60 group-hover:opacity-100"
												>
													<MoreVertical className="h-3.5 w-3.5" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-32">
												<DropdownMenuItem
													onClick={(e) => {
														e.stopPropagation();
														onDeleteChat(chat.id);
													}}
													className="text-red-600 focus:text-red-600"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													{t("common.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								))
							)}
						</div>
					</ScrollArea>
				</div>
			</div>
			{/* BOTTOM SECTION - Fixed height at bottom (User Profile or Login) */}
			{mode !== "client" && (
				<div className="mt-auto flex-shrink-0">
					<div className="p-4">
						{isAuthenticated ? (
							/* Logged in user profile with UserMenu */
							<UserMenu showLoginButton={false} className="w-full" />
						) : (
							/* Login prompt for non-authenticated users */
							<div className="space-y-3">
								<div className="text-center">
									<p className="font-medium text-sm">{t("auth.welcomeMessage")}</p>
									<p className="text-muted-foreground text-xs">{t("auth.loginToSave")}</p>
								</div>
								<LoginButton className="w-full" />
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
	// Mobile: Use Sheet (drawer) - controlled by hooks
	if (isMobile) {
		return (
			<Sheet open={isOpen} onOpenChange={setOpen}>
				<SheetContent side="left" className="w-80 bg-background/95 p-0 backdrop-blur-lg [&>button]:z-50">
					<SidebarContent />
				</SheetContent>
			</Sheet>
		);
	} // Desktop: Slide-in/out animation - sidebar slides completely off screen when collapsed
	return (
		<>
			{/* Sidebar container - slides in from left */}
			<div
				className={cn(
					"fixed top-0 left-16 z-30 h-full transition-transform duration-300 ease-in-out",
					"w-80 border-border/50 border-r",
					// Transform based slide animation: slide out to left when collapsed
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Always show full sidebar content */}
				<div className="fade-in-0 animate-in duration-200">
					<SidebarContent />
				</div>
			</div>
			{/* Floating expand button - only visible when collapsed and after animation */}
			{!isOpen && showExpandButton && (
				<div className="fade-in-0 fixed top-4 left-20 z-40 animate-in duration-200">
					<ChatSidebarTrigger useDesktopIcons={true} className="h-10 w-10 transition-transform hover:scale-110" />
				</div>
			)}
		</>
	);
}
