import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server/node.ts"],
	outDir: ".bin",
	format: "esm",
	platform: "node",
	clean: true,
});
