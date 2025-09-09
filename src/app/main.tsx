import "@bprogress/core/css";
import { BProgress } from "@bprogress/core";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
// Import i18n configuration
import "./i18n";
// Import polyfills
import "./lib/polyfills";

import "./index.css";

BProgress.configure({
	showSpinner: false,
});

// Create a new router instance
const router = createRouter({ routeTree });
router.subscribe("onBeforeLoad", ({ fromLocation, pathChanged }) => {
	// Don't show the progress bar on initial page load, seems like the onLoad event doesn't fire in that case
	fromLocation && pathChanged && BProgress.start();
});
router.subscribe("onLoad", () => {
	BProgress.done();
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
}
