import { toast as sonnerToast } from "sonner";

interface ToastProps {
	title: string;
	description?: string;
	variant?: "default" | "destructive";
}

export function useToast() {
	const toast = ({ title, description, variant = "default" }: ToastProps) => {
		if (variant === "destructive") {
			sonnerToast.error(title, {
				description,
			});
		} else {
			sonnerToast.success(title, {
				description,
			});
		}
	};

	return { toast };
}
