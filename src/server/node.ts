import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./api";

import "dotenv/config";

app.use("/*", serveStatic({ root: "dist" }));
serve({ fetch: app.fetch, port: 9999 });
