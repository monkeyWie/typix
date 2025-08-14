import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { Check, Copy, Download, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ActionState = "idle" | "loading" | "success" | "error";

interface MessageActionsProps {
	messageId: string;
	messageType: "text" | "image";
	content?: string;
	imageUrls?: string[];
	isUser: boolean;
	onDelete?: (messageId: string) => void;
	className?: string;
}

export function MessageActions({
	messageId,
	messageType,
	content,
	imageUrls,
	isUser,
	onDelete,
	className,
}: MessageActionsProps) {
	const { t } = useTranslation();
	const [copyState, setCopyState] = useState<ActionState>("idle");
	const [downloadState, setDownloadState] = useState<ActionState>("idle");
	const [deleteState, setDeleteState] = useState<ActionState>("idle");

	const resetStateAfterDelay = (setState: (state: ActionState) => void, delay = 1500) => {
		setTimeout(() => setState("idle"), delay);
	};

	const handleCopy = async () => {
		setCopyState("loading");
		try {
			if (messageType === "text" && content) {
				await navigator.clipboard.writeText(content);
			} else if (messageType === "image" && imageUrls && imageUrls.length > 0) {
				// For images, copy the actual image data to clipboard
				const imageUrl = imageUrls[0]!;
				const response = await fetch(imageUrl);
				const blob = await response.blob();

				// Create ClipboardItem with the image blob
				const clipboardItem = new ClipboardItem({
					[blob.type]: blob,
				});

				await navigator.clipboard.write([clipboardItem]);
			}
			setCopyState("success");
			resetStateAfterDelay(setCopyState);
		} catch (error) {
			console.error("Failed to copy:", error);
			setCopyState("error");
			resetStateAfterDelay(setCopyState);
		}
	};

	const handleDownload = async () => {
		if (!imageUrls || imageUrls.length === 0) return;

		setDownloadState("loading");

		try {
			const imageUrl = imageUrls[0]!; // Only download the first image
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = url;
			// Extract file extension from URL or default to jpg
			const urlPath = new URL(imageUrl).pathname;
			const extension = urlPath.split(".").pop() || "jpg";
			link.download = `generated-image-${messageId}.${extension}`;

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			window.URL.revokeObjectURL(url);

			setDownloadState("success");
			resetStateAfterDelay(setDownloadState);
		} catch (error) {
			console.error("Failed to download image:", error);
			setDownloadState("error");
			resetStateAfterDelay(setDownloadState);
		}
	};

	const handleDelete = async () => {
		if (!onDelete) return;

		setDeleteState("loading");
		try {
			await onDelete(messageId);
			setDeleteState("success");
			resetStateAfterDelay(setDeleteState);
		} catch (error) {
			console.error("Failed to delete message:", error);
			setDeleteState("error");
			resetStateAfterDelay(setDeleteState);
		}
	};

	const getIconForState = (state: ActionState, IdleIcon: any, loadingClassName = "") => {
		switch (state) {
			case "loading":
				return <Loader2 className={cn("h-4 w-4 animate-spin", loadingClassName)} />;
			case "success":
				return <Check className="h-4 w-4 text-green-600" />;
			case "error":
				return <X className="h-4 w-4 text-red-600" />;
			default:
				return <IdleIcon className="h-4 w-4" />;
		}
	};

	return (
		<div
			className={cn(
				"flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 p-1 shadow-lg backdrop-blur-sm",
				className,
			)}
		>
			{/* Copy button */}
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-8 w-8 hover:bg-muted/80",
					copyState === "success" && "bg-green-100 hover:bg-green-100",
					copyState === "error" && "bg-red-100 hover:bg-red-100",
				)}
				onClick={handleCopy}
				disabled={copyState === "loading"}
				title={t("chat.actions.copy")}
			>
				{getIconForState(copyState, Copy)}
			</Button>

			{/* Download button - only for images */}
			{messageType === "image" && imageUrls && imageUrls.length > 0 && (
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"h-8 w-8 hover:bg-muted/80",
						downloadState === "success" && "bg-green-100 hover:bg-green-100",
						downloadState === "error" && "bg-red-100 hover:bg-red-100",
					)}
					onClick={handleDownload}
					disabled={downloadState === "loading"}
					title={t("chat.actions.download")}
				>
					{getIconForState(downloadState, Download)}
				</Button>
			)}

			{/* Delete button */}
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-8 w-8 hover:bg-destructive/20 hover:text-destructive",
					deleteState === "success" && "bg-green-100 hover:bg-green-100",
					deleteState === "error" && "bg-red-100 hover:bg-red-100",
				)}
				onClick={handleDelete}
				disabled={deleteState === "loading"}
				title={t("chat.actions.delete")}
			>
				{getIconForState(deleteState, Trash2)}
			</Button>
		</div>
	);
}
