import { client } from "../db/sqlite";
import { createAuth } from "./auth";

// Just to create the required tables for Better Auth
// npx @better-auth/cli generate --config src/server/lib/auth.config.ts --output src/server/db/schemas/auth.ts
export const auth = createAuth(client);
