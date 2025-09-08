import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import JSZip from "jszip";
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

		// For single image, download directly
		if (imageUrls.length === 1) {
			await downloadSingleImage(imageUrls[0]!, 0);
		} else {
			// For multiple images, download as ZIP
			await downloadAllAsZip();
		}
	};

	const downloadSingleImage = async (imageUrl: string, index: number) => {
		setDownloadState("loading");

		try {
			// Create a temporary link element
			const link = document.createElement("a");
			link.href = imageUrl;
			link.style.display = "none";
			link.target = "_blank";
			link.rel = "noopener noreferrer";

			// Generate filename with timestamp and index
			const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
			let extension = "jpg"; // default extension

			// Extract extension from URL
			if (imageUrl.startsWith("data:")) {
				// Handle base64 data URI: data:image/png;base64,xxx
				const mimeType = imageUrl.split(":")[1]?.split(";")[0]?.split("/")[1];
				if (mimeType) {
					// Map MIME types to file extensions
					switch (mimeType.toLowerCase()) {
						case "jpeg":
							extension = "jpg";
							break;
						case "png":
							extension = "png";
							break;
						case "gif":
							extension = "gif";
							break;
						case "webp":
							extension = "webp";
							break;
						case "bmp":
							extension = "bmp";
							break;
						case "svg+xml":
							extension = "svg";
							break;
						default:
							extension = mimeType; // Use the mime type as extension
					}
				}
			} else {
				// Handle regular URL
				try {
					const urlPath = new URL(imageUrl).pathname;
					const urlExtension = urlPath.split(".").pop()?.toLowerCase();
					if (urlExtension && /^(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlExtension)) {
						extension = urlExtension;
					}
				} catch {
					// Keep default extension if URL parsing fails
				}
			}

			// Set filename: single image doesn't need index, multiple images include index
			const filename =
				imageUrls?.length === 1
					? `typix-image-${timestamp}.${extension}`
					: `typix-image-${timestamp}-${index + 1}.${extension}`;

			link.download = filename;

			// Add to DOM, click, and remove
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			setDownloadState("success");
			resetStateAfterDelay(setDownloadState);
		} catch (error) {
			console.error("Failed to download image:", error);

			// Fallback: open image in new tab
			try {
				window.open(imageUrl, "_blank", "noopener,noreferrer");
				setDownloadState("success");
				resetStateAfterDelay(setDownloadState);
			} catch (fallbackError) {
				console.error("Fallback also failed:", fallbackError);
				setDownloadState("error");
				resetStateAfterDelay(setDownloadState);
			}
		}
	};

	const downloadAllAsZip = async () => {
		if (!imageUrls || imageUrls.length === 0) return;

		setDownloadState("loading");

		try {
			const zip = new JSZip();
			const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");

			// Download all images and add to zip
			const downloadPromises = imageUrls.map(async (imageUrl, index) => {
				try {
					const response = await fetch(imageUrl);
					if (!response.ok) {
						throw new Error(`Failed to fetch image ${index + 1}`);
					}
					const blob = await response.blob();

					// Determine file extension
					let extension = "jpg";
					if (imageUrl.startsWith("data:")) {
						const mimeType = imageUrl.split(":")[1]?.split(";")[0]?.split("/")[1];
						if (mimeType) {
							switch (mimeType.toLowerCase()) {
								case "jpeg":
									extension = "jpg";
									break;
								case "png":
									extension = "png";
									break;
								case "gif":
									extension = "gif";
									break;
								case "webp":
									extension = "webp";
									break;
								default:
									extension = mimeType;
							}
						}
					} else {
						try {
							const urlPath = new URL(imageUrl).pathname;
							const urlExtension = urlPath.split(".").pop()?.toLowerCase();
							if (urlExtension && /^(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlExtension)) {
								extension = urlExtension;
							}
						} catch {
							// Keep default extension
						}
					}

					const filename = `image-${index + 1}.${extension}`;
					zip.file(filename, blob);
				} catch (error) {
					console.error(`Failed to download image ${index + 1}:`, error);
					// Continue with other images even if one fails
				}
			});

			await Promise.all(downloadPromises);

			// Generate and download the ZIP file
			const zipBlob = await zip.generateAsync({ type: "blob" });
			const zipUrl = URL.createObjectURL(zipBlob);

			const link = document.createElement("a");
			link.href = zipUrl;
			link.download = `typix-images-${timestamp}.zip`;
			link.style.display = "none";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up blob URL
			setTimeout(() => URL.revokeObjectURL(zipUrl), 100);

			setDownloadState("success");
			resetStateAfterDelay(setDownloadState);
		} catch (error) {
			console.error("Failed to download images as ZIP:", error);
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
