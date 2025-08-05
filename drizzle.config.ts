import type { Config } from "drizzle-kit";

const config = {
	schema: "./src/server/db/schemas/index.ts",
	dialect: "sqlite",
	casing: "snake_case",
	out: "./drizzle/migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;

export default config;
