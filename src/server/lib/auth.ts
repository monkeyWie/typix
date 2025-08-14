import { scryptSync } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "./email";

export interface AuthConfig {
	email: {
		verification: boolean; // Enable email verification
		resend: {
			apiKey: string;
			from: string;
		};
	};
	social: {
		google: {
			enabled: boolean;
			clientId: string;
			clientSecret: string;
		};
		github: {
			enabled: boolean;
			clientId: string;
			clientSecret: string;
		};
	};
}

export const createAuth = (db: any, config?: AuthConfig) =>
	betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: config?.email?.verification === true,
			// Custom password hashing function to avoid cloudflare workers cpu limitations, see: https://github.com/better-auth/better-auth/issues/969
			password: {
				hash: async (password) => {
					const salt = crypto.getRandomValues(new Uint8Array(16));
					const saltHex = Array.from(salt)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");

					const key = scryptSync(password.normalize("NFKC"), saltHex, 64, {
						N: 16384,
						r: 16,
						p: 1,
						maxmem: 128 * 16384 * 16 * 2,
					});

					const keyHex = Array.from(key)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return `${saltHex}:${keyHex}`;
				},
				verify: async ({ hash, password }) => {
					const [saltHex, keyHex] = hash.split(":");

					const targetKey = scryptSync(password.normalize("NFKC"), saltHex!, 64, {
						N: 16384,
						r: 16,
						p: 1,
						maxmem: 128 * 16384 * 16 * 2,
					});

					const targetKeyHex = Array.from(targetKey)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return targetKeyHex === keyHex;
				},
			},
		},
		/* 	emailVerification: {
			sendVerificationEmail: async ({ user, url, token }, request) => {
				console.log(`Sending verification email to ${user.email}`, url);
				await sendEmail(user.email, url);
			},
		}, */
		emailVerification: {
			autoSignInAfterVerification: true,
		},
		plugins: [
			emailOTP({
				overrideDefaultEmailVerification: true,
				async sendVerificationOTP({ email, otp, type }) {
					// Implement the sendVerificationOTP method to send the OTP to the user's email address
					console.log(`Sending ${type} OTP to ${email}: ${otp} ${type}`);
					await sendEmail(email, otp);
				},
			}),
		],
		socialProviders: {
			google:
				config?.social.google.enabled === true
					? {
							clientId: config.social.google.clientId,
							clientSecret: config.social.google.clientSecret,
						}
					: undefined,
			github:
				config?.social.github.enabled === true
					? {
							clientId: config.social.github.clientId,
							clientSecret: config.social.github.clientSecret,
						}
					: undefined,
		},
	});
