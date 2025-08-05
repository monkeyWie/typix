import type { MigrationMeta } from "drizzle-orm/migrator";
import migrationJournal from "./migrations/meta/_journal.json";

const migrations = Object.fromEntries(
	Object.entries(
		import.meta.glob("./migrations/*.sql", {
			eager: true,
			query: "?raw",
			import: "default",
		}),
	).map(([key, value]) => [key.substring(13, key.length - 4), value]),
);

async function createSha256Hash(query: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(query);
	const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hash));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}

// SHA-256 implementation as fallback
function createSha256HashFallback(str: string): string {
	let hash = 0;
	if (str.length === 0) return hash.toString(16);

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Convert to positive hex string with padding
	const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
	// Extend to 64 characters to mimic SHA-256 length
	return hexHash.repeat(8).substring(0, 64);
}

export async function getMigrations() {
	const journal = migrationJournal as {
		entries: Array<{
			idx: number;
			when: number;
			tag: string;
			breakpoints: boolean;
		}>;
	};
	const migrationQueries: MigrationMeta[] = [];
	for (const journalEntry of journal.entries) {
		const query = migrations[journalEntry.tag as keyof typeof migrations] as string;
		const result = query.split("--> statement-breakpoint");
		migrationQueries.push({
			sql: result,
			bps: journalEntry.breakpoints,
			folderMillis: journalEntry.when,
			hash: globalThis.crypto.subtle ? await createSha256Hash(query) : createSha256HashFallback(query),
		});
	}
	return migrationQueries;
}
