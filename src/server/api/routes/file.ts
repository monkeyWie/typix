import fs from "node:fs/promises";
import { getFileMetadata } from "@/server/service/file/storage";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { type Env, authMiddleware } from "../util";

const app = new Hono<Env>()
	.basePath("/files")
	.use(authMiddleware)
	.get("/preview/:id", async (c) => {
		const user = c.var.user!;
		const fileId = c.req.param("id");

		const metadata = await getFileMetadata(fileId, user.id);
		if (!metadata) {
			return c.json({ error: "File not found" }, 404);
		}

		// Determine content type based on protocol
		let contentType = "image/png";
		if (metadata.protocol === "data:") {
			const base64Header = metadata.accessUrl.split(",")[0];
			contentType = base64Header?.split(";")[0]?.split(":")[1] || "image/png";
		} else if (metadata.protocol === "file:") {
			const suffix = metadata.accessUrl.split(".").pop();
			contentType = `image/${suffix}`;
		}

		// Set ETag and check cache
		const etag = btoa(`"${user.id}-${fileId}"`);
		c.header("ETag", etag);
		c.header("Content-Type", contentType);
		c.header("Cache-Control", "private, max-age=31536000");

		if (c.req.header("If-None-Match") === etag) {
			return c.body(null, 304);
		}

		switch (metadata.protocol) {
			case "data:": {
				const [base64Header, base64Data] = metadata.accessUrl.split(",");
				if (!base64Header || !base64Data) {
					return c.json({ error: "Invalid file data" }, 500);
				}
				return stream(c, async (stream) => {
					const buffer = Buffer.from(base64Data, "base64");
					await stream.write(buffer);
				});
			}
			case "file:": {
				const fileBuffer = await fs.readFile(metadata.accessUrl);
				return stream(c, async (stream) => {
					await stream.write(fileBuffer);
				});
			}
			default: {
				// For other protocols, we assume it's a URL and redirect
				return c.redirect(metadata.accessUrl);
			}
		}
	});

export default app;
