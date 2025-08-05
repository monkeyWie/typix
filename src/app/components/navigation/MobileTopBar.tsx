import { Button } from "@/app/components/ui/button";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

interface MobileTopBarProps {
	title: string;
	onBack?: () => void;
}

export function MobileTopBar({ title, onBack }: MobileTopBarProps) {
	const router = useRouter();
	const navigate = useNavigate();

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			// Navigate back one level based on current route path
			const currentPath = router.state.location.pathname;

			// If already at root, do nothing
			if (currentPath === "/") {
				return;
			}

			// Get parent path by removing the last segment
			const pathSegments = currentPath.split("/").filter(Boolean);
			if (pathSegments.length > 1) {
				// Navigate to parent path: /a/b -> /a
				const parentPath = `/${pathSegments.slice(0, -1).join("/")}`;
				navigate({ to: parentPath, search: {} });
			} else {
				// Navigate to root: /a -> /
				navigate({ to: "/", search: {} });
			}
		}
	};
	return (
		<div className="border-b p-4">
			<div className="relative flex items-center">
				<Button variant="ghost" size="icon" onClick={handleBack} className="absolute left-0 z-10">
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1 text-center">
					<h1 className="font-semibold text-lg">{title}</h1>
				</div>
			</div>
		</div>
	);
}
