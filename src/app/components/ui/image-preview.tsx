import Lightbox, { type SlotStyles } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

export interface ImageSlide {
	src: string;
	title?: string;
}

interface ImagePreviewProps {
	open: boolean;
	close: () => void;
	slides: ImageSlide[];
	index?: number;
	onIndexChange?: (index: number) => void;
	plugins?: {
		captions?: boolean;
		counter?: boolean;
		download?: boolean;
		fullscreen?: boolean;
		zoom?: boolean;
	};
	zoomConfig?: {
		maxZoomPixelRatio?: number;
		zoomInMultiplier?: number;
		doubleTapDelay?: number;
		doubleClickDelay?: number;
		doubleClickMaxStops?: number;
		keyboardMoveDistance?: number;
		wheelZoomDistanceFactor?: number;
		pinchZoomDistanceFactor?: number;
		scrollToZoom?: boolean;
	};
	styles?: SlotStyles;
}

export function ImagePreview({
	open,
	close,
	slides,
	index = 0,
	onIndexChange,
	plugins = {
		captions: true,
		counter: true,
		download: true,
		fullscreen: true,
		zoom: true,
	},
	zoomConfig = {
		maxZoomPixelRatio: 3,
		zoomInMultiplier: 2,
		doubleTapDelay: 300,
		doubleClickDelay: 300,
		doubleClickMaxStops: 2,
		keyboardMoveDistance: 50,
		wheelZoomDistanceFactor: 100,
		pinchZoomDistanceFactor: 100,
		scrollToZoom: true,
	},
	styles = {
		container: {
			backgroundColor: "rgba(0, 0, 0, 0.9)",
		},
	},
}: ImagePreviewProps) {
	// Handle download for base64 images
	const handleDownload = ({ slide, saveAs }: any) => {
		// Check if the src is a base64 data URL
		if (slide.src.startsWith('data:image/')) {
			// Convert base64 to blob and download
			fetch(slide.src)
				.then(response => response.blob())
				.then(blob => {
					// Determine file extension from MIME type
					const mimeTypeParts = slide.src.split(';')[0]?.split(':');
					const mimeType = mimeTypeParts?.[1];
					const extension = mimeType?.split('/')[1] || 'png';
					
					// Determine filename
					const filename = slide.download === true 
						? `${slide.title || 'image'}.${extension}`
						: (typeof slide.download === 'string' ? slide.download : `${slide.title || 'image'}.${extension}`);
					
					// Create download URL and trigger download
					const url = URL.createObjectURL(blob);
					
					if (saveAs) {
						saveAs(url, filename);
					} else {
						// Fallback: create download link manually
						const link = document.createElement('a');
						link.href = url;
						link.download = filename;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}
					
					// Clean up blob URL after a short delay
					setTimeout(() => URL.revokeObjectURL(url), 100);
				})
				.catch(error => {
					console.error('Error downloading base64 image:', error);
				});
		} else {
			// For regular URLs, determine filename and use saveAs if available
			const filename = slide.download === true 
				? slide.title || 'image'
				: (typeof slide.download === 'string' ? slide.download : slide.title || 'image');
			
			if (saveAs) {
				saveAs(slide.src, filename);
			} else {
				// Fallback: create download link manually
				const link = document.createElement('a');
				link.href = slide.src;
				link.download = filename;
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	};

	// Build plugins array based on configuration
	const enabledPlugins = [];
	if (plugins.captions!==false) enabledPlugins.push(Captions);
	if (plugins.counter!==false) enabledPlugins.push(Counter);
	if (plugins.download!==false) enabledPlugins.push(Download);
	if (plugins.fullscreen!==false) enabledPlugins.push(Fullscreen);
	if (plugins.zoom!==false) enabledPlugins.push(Zoom);

	// Single image carousel configuration
	const isSingleImage = slides.length <= 1;

	return (
		<Lightbox
			open={open}
			close={close}
			slides={slides}
			index={index}
			plugins={enabledPlugins}
			zoom={plugins.zoom ? zoomConfig : undefined}
			download={plugins.download ? { download: handleDownload } : undefined}
			carousel={{
				finite: isSingleImage,
			}}
			styles={styles}
			render={{
				buttonPrev: isSingleImage ? () => null : undefined,
				buttonNext: isSingleImage ? () => null : undefined,
			}}
			on={{
				view: onIndexChange ? ({ index: newIndex }) => onIndexChange(newIndex) : undefined,
			}}
		/>
	);
}
