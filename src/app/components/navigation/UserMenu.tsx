import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/app/lib/utils";
import { useUIStore } from "@/app/stores";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserMenuProps {
	className?: string;
	showLoginButton?: boolean;
}

export function UserMenu({ className, showLoginButton = true }: UserMenuProps) {
	const { user, isLogin, logout } = useAuth();
	const { openLoginModal } = useUIStore();
	const { t } = useTranslation();
	const navigate = useNavigate();

	// If user is not logged in, show login button
	if (!isLogin && showLoginButton) {
		return (
			<Button
				variant="ghost"
				onClick={openLoginModal}
				className={cn("h-auto w-full justify-start gap-3 p-3 transition-colors hover:bg-accent/50", className)}
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
					<User className="h-4 w-4 text-muted-foreground" />
				</div>
				<span className="font-medium text-sm">{t("auth.login")}</span>
			</Button>
		);
	}

	// If not logged in and not showing login button, return null
	if (!isLogin) {
		return null;
	}

	// Get user display name and initials
	const displayName = user?.name || user?.email || t("user.defaultName");
	const initials = displayName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const handleLogout = async () => {
		try {
			await logout();
			window.location.reload();
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	const handleSettings = () => {
		navigate({ to: "/settings", search: {} });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className={cn("h-auto w-full justify-start gap-3 p-3 transition-colors hover:bg-accent/50", className)}
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={user?.image || undefined} alt={t("user.avatar")} />
						<AvatarFallback className="bg-primary font-semibold text-primary-foreground text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 text-left">
						<p className="truncate font-medium text-sm">{displayName}</p>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<div className="flex items-center space-x-3 p-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={user?.image || undefined} alt={t("user.avatar")} />
						<AvatarFallback className="bg-primary font-semibold text-primary-foreground text-sm">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 space-y-1">
						<p className="font-medium text-sm leading-none">{displayName}</p>
						{user?.email && <p className="text-muted-foreground text-xs leading-none">{user.email}</p>}
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSettings}>
					<Settings className="mr-2 h-4 w-4" />
					{t("settings.title")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
					<LogOut className="mr-2 h-4 w-4" />
					{t("user.signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
