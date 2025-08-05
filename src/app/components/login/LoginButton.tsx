import { Button } from "@/app/components/ui/button";
import { useUIStore } from "@/app/stores";
import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoginButtonProps {
	variant?: "default" | "outline" | "ghost" | "link";
	size?: "default" | "sm" | "lg" | "icon";
	children?: React.ReactNode;
	className?: string;
}

export function LoginButton({ variant = "default", size = "default", children, className }: LoginButtonProps) {
	const { openLoginModal } = useUIStore();
	const { t } = useTranslation();

	return (
		<Button variant={variant} size={size} className={className} onClick={openLoginModal}>
			<LogIn className="mr-2 h-4 w-4" />
			{children || t("auth.login")}
		</Button>
	);
}
