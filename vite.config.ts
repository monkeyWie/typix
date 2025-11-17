import fs from "node:fs";
import path from "node:path";
import devServer from "@hono/vite-dev-server";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import TOML from "smol-toml";
import { defineConfig, loadEnv } from "vite";
import { analyzer } from "vite-bundle-analyzer";

// Read wrangler.toml configuration
function readWranglerConfig() {
	try {
		const wranglerPath = path.resolve(__dirname, "wrangler.toml");
		if (fs.existsSync(wranglerPath)) {
			const content = fs.readFileSync(wranglerPath, "utf-8");
			const config = TOML.parse(content) as any;
			return config.vars || {};
		}
	} catch (error) {
		console.warn("Failed to read wrangler.toml:", error);
	}
	return {};
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const wranglerVars = readWranglerConfig();

	// Adapted to work in both Cloudflare Workers and Node.js environments
	function getEnv(key: string, defaultValue?: string): string | undefined {
		const envValue = process.env[key] || env[key] || wranglerVars[key];
		if (envValue !== undefined) {
			return JSON.stringify(envValue);
		}
		if (defaultValue !== undefined) {
			return JSON.stringify(defaultValue);
		}
		return undefined;
	}

	return {
		plugins: [
			TanStackRouterVite({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: "src/app/routes",
				generatedRouteTree: "src/app/routeTree.gen.ts",
			}),
			react(),
			tailwindcss(),
			devServer({
				entry: "./src/server/index.ts",
				exclude: [
					/.*\.tsx?($|\?)/,
					/.*\.(s?css|less)($|\?)/,
					/.*\.(svg|png)($|\?)/,
					/.*\.json($|\?)/,
					/.*\.sql($|\?)/,
					/^\/@.+$/,
					/^\/favicon\.ico$/,
					/^\/(public|assets|static)\/.+/,
					/^\/node_modules\/.*/,
				],
				injectClientScript: false,
			}),
			mode === "analyze" ? analyzer() : undefined,
		],
		optimizeDeps: {
			exclude: ["@vlcn.io/crsqlite-wasm"],
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		// Only define environment variables that are needed on the client side
		define: {
			"import.meta.env.RUNTIME": getEnv("RUNTIME"),
			"import.meta.env.MODE": getEnv("MODE"),
			"import.meta.env.AUTH_EMAIL_VERIFICATION_ENABLED": getEnv("AUTH_EMAIL_VERIFICATION_ENABLED"),
			"import.meta.env.AUTH_SOCIAL_GOOGLE_ENABLED": getEnv("AUTH_SOCIAL_GOOGLE_ENABLED"),
			"import.meta.env.AUTH_SOCIAL_GITHUB_ENABLED": getEnv("AUTH_SOCIAL_GITHUB_ENABLED"),
			"import.meta.env.GOOGLE_ANALYTICS_ID": getEnv("GOOGLE_ANALYTICS_ID"),
			"import.meta.env.PROVIDER_CLOUDFLARE_BUILTIN": getEnv("PROVIDER_CLOUDFLARE_BUILTIN"),
		},
	};
});
