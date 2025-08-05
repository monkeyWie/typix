import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
	output: "export",
	basePath: isProduction ? "/home" : undefined,
	images: {
		unoptimized: true,
	},
	experimental: {
		esmExternals: true,
	},
	skipTrailingSlashRedirect: true,
} satisfies NextConfig;

export default withNextIntl(nextConfig);
