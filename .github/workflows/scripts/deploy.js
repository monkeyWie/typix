// @ts-nocheck
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";

const __dirname = process.cwd();

const config = {
  preview: {
    docs: false,
    override: {
      name: "typix-preview",
      vars: {
        MODE: "client",
        PROVIDER_CLOUDFLARE_BUILTIN: "true",
      },
    },
  },
  production: {
    docs: true,
    override: {
      vars: {
        MODE: "mixed",
        GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
        AUTH_EMAIL_VERIFICATION_ENABLED: "true",
        AUTH_EMAIL_RESEND_API_KEY: process.env.AUTH_EMAIL_RESEND_API_KEY,
        AUTH_EMAIL_RESEND_FROM: "Typix <hi@typix.art>",
        AUTH_SOCIAL_GOOGLE_ENABLED: "true",
        AUTH_SOCIAL_GOOGLE_CLIENT_ID: process.env.AUTH_SOCIAL_GOOGLE_CLIENT_ID,
        AUTH_SOCIAL_GOOGLE_CLIENT_SECRET:
          process.env.AUTH_SOCIAL_GOOGLE_CLIENT_SECRET,
        AUTH_SOCIAL_GITHUB_ENABLED: "true",
        AUTH_SOCIAL_GITHUB_CLIENT_ID: process.env.AUTH_SOCIAL_GITHUB_CLIENT_ID,
        AUTH_SOCIAL_GITHUB_CLIENT_SECRET:
          process.env.AUTH_SOCIAL_GITHUB_CLIENT_SECRET,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        PROVIDER_CLOUDFLARE_BUILTIN: "true",
      },
    },
  },
};

/**
 * Read wrangler.toml file
 * @returns {any} Parsed TOML configuration object
 */
function readWranglerConfig() {
  const wranglerPath = path.join(__dirname, "wrangler.toml");
  const content = fs.readFileSync(wranglerPath, "utf8");
  return parseToml(content);
}

/**
 * Write wrangler.toml file
 * @param {any} config - Configuration object
 */
function writeWranglerConfig(config) {
  const wranglerPath = path.join(__dirname, "wrangler.toml");
  const content = stringifyToml(config);
  fs.writeFileSync(wranglerPath, content, "utf8");
}

/**
 * Deep merge objects
 * @param {any} target - Target object
 * @param {any} source - Source object
 * @returns {any} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Update wrangler configuration
 * @param {any} override - Configuration override for the environment
 * @param {any} baseConfig - Base configuration copy
 */
function updateWranglerConfig(override, baseConfig) {
  const updatedConfig = deepMerge(baseConfig, override);
  writeWranglerConfig(updatedConfig);
}

/**
 * Build and deploy
 */
function buildAndDeploy(config) {
  console.log("📦 Building application...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Application built successfully");

  if (config.docs) {
    console.log("📚 Building documentation...");
    execSync(
      "cd ./docs && npm install && npm run build && cp -r ./out/ ../dist/home && cd ..",
      { stdio: "inherit" }
    );
    console.log("✅ Documentation built successfully");
  }

  console.log("🚀 Deploying to Cloudflare...");
  if (config.override.vars.MODE === "client") {
    execSync("npm run deploy:no-migrate", { stdio: "inherit" });
  } else {
    execSync("npm run deploy", { stdio: "inherit" });
  }
  console.log("✅ Deployed successfully");
}

/**
 * Deploy multiple environments
 * @param {string[]} environments - Environment list
 */
function deployEnvironments(environments) {
  console.log(
    `🔄 Starting deployment for environments: ${environments.join(", ")}`
  );

  // Read original configuration as a copy
  const baseConfig = readWranglerConfig();
  console.log("📋 Base configuration loaded");

  for (const environment of environments) {
    console.log(`\n--- Deploying ${environment} environment ---`);
    const envConfig = config[environment];
    try {
      updateWranglerConfig(envConfig.override, baseConfig);
      buildAndDeploy(envConfig);
    } catch (error) {
      console.error(
        `❌ Failed to deploy ${environment} environment:`,
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  }

  console.log(
    `\n🎉 All environments (${environments.join(", ")}) deployed successfully!`
  );
}

// Command line interface
function main() {
  try {
    const { values } = parseArgs({
      options: {
        preview: {
          type: "boolean",
          short: "p",
          default: false,
        },
        production: {
          type: "boolean",
          short: "P",
          default: false,
        },
        help: {
          type: "boolean",
          short: "h",
          default: false,
        },
      },
      allowPositionals: false,
    });

    const environments = [];

    if (values.preview) {
      environments.push("preview");
    }

    if (values.production) {
      environments.push("production");
    }

    if (environments.length === 0) {
      environments.push("production");
    }

    for (const env of environments) {
      if (!(env in config)) {
        console.error(`❌ Unknown environment: ${env}`);
        console.log("Available environments: production, preview");
        process.exit(1);
      }
    }

    deployEnvironments(environments);
  } catch (error) {
    console.error(
      "❌ Error parsing arguments:",
      error instanceof Error ? error.message : String(error)
    );
    console.log("Use --help for usage information");
    process.exit(1);
  }
}

main();
