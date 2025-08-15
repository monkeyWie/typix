import type { DrizzleDb } from "@/server/db";
import * as schema from "@/server/db/schemas";
import initWasm from "@vlcn.io/crsqlite-wasm";
import { SQLiteError } from "@vlcn.io/wa-sqlite";
import { drizzle } from "drizzle-orm-crsqlite-wasm";
import { migrate } from "drizzle-orm-crsqlite-wasm/migrator";
import { getMigrations } from "../../../drizzle";

let db: DrizzleDb | undefined;
let initPromise: Promise<DrizzleDb> | undefined;
let migratePromise: Promise<void> | undefined;

// Constants for cross-tab migration synchronization
const MIGRATE_LOCK_NAME = "typix_migrate_lock";

/**
 * Run database migrations with cross-tab synchronization using Web Locks API
 */
async function runMigrations(db: DrizzleDb) {
	if (migratePromise) return migratePromise;

	migratePromise = (async () => {
		await navigator.locks.request(
			MIGRATE_LOCK_NAME,
			{
				mode: "exclusive",
				ifAvailable: false, // Wait for lock if not available
			},
			async () => {
				try {
					await migrate(db as any, { migrations: await getMigrations() });
				} catch (error) {
					console.error("Migration failed:", error);
					throw error;
				}
			},
		);
	})();

	return migratePromise;
}

/**
 * Create database connection
 */
async function createDb() {
	const sqlite3 = await initWasm();
	const sql = await sqlite3.open("typix");
	return drizzle(sql, {
		schema,
		logger: process.env.NODE_ENV === "development" ? true : undefined,
		casing: "snake_case",
	}) as unknown as DrizzleDb;
}

export async function initDb() {
	// Prevent local competition (e.g., useEffect called twice)
	if (db) return db;

	if (initPromise) return;

	initPromise = (async () => {
		// Create database connection (local operation)
		db = await createDb();
		// Run migrations with cross-tab synchronization
		try {
			await runMigrations(db);
		} catch (error: any) {
			console.error("Failed to run migrations:", error);
			if (error instanceof SQLiteError && error.message.includes("exists")) {
				console.warn("Database migration conflict detected, resetting database...");
				await new Promise((resolve, reject) => {
					const request = indexedDB.deleteDatabase("idb-batch-atomic");
					request.onsuccess = resolve;
					request.onblocked = resolve;
					request.onerror = () => reject(request.error);
				});
				window.location.reload();
			}
		}
		return db;
	})();

	return await initPromise;
}

export function getDb() {
	if (!db) throw new Error("Database not initialized. Call initDb() first.");
	return db;
}

// Clean up on page unload
if (typeof window !== "undefined") {
	window.addEventListener("beforeunload", () => {
		try {
			// With navigator.locks, we don't need manual cleanup as locks are automatically released
			// when the page/tab is closed. We only clean up the completion flag if needed.
			// localStorage.removeItem("typix_migration_completed");
		} catch {}
	});
}
