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

		const etag = btoa(`"${user.id}-${fileId}"`);
		c.header("ETag", etag);
		if (c.req.header("If-None-Match") === etag) {
			return new Response(null, {
				status: 304,
				statusText: "Not Modified",
			});
		}

		const metadata = await getFileMetadata(fileId, user.id);
		if (!metadata) {
			return c.json({ error: "File not found" }, 404);
		}

		switch (metadata.protocol) {
			case "data:": {
				const [base64Header, base64Data] = metadata.accessUrl.split(",");
				if (!base64Header || !base64Data) {
					return c.json({ error: "Invalid file data" }, 500);
				}
				// Set the content type based on the header
				const contentType = base64Header.split(";")[0]?.split(":")[1] || "image/png";
				c.header("Content-Type", contentType);
				return stream(c, async (stream) => {
					const buffer = Buffer.from(base64Data, "base64");
					await stream.write(buffer);
				});
			}
			case "file:": {
				const suffix = metadata.accessUrl.split(".").pop();
				const fileBuffer = await fs.readFile(metadata.accessUrl);
				c.header("Content-Type", `image/${suffix}`);
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
