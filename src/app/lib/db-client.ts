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
const MIGRATE_LOCK_KEY = "typix_migrate_lock";
const MIGRATE_STATUS_KEY = "typix_migrate_status";
const TIMEOUT = 30000; // 30 seconds

/**
 * Try to acquire migration lock across tabs
 */
async function acquireMigrateLock() {
	try {
		const now = Date.now();
		const lock = localStorage.getItem(MIGRATE_LOCK_KEY);

		// Check existing lock
		if (lock) {
			const { timestamp } = JSON.parse(lock);
			if (now - timestamp < TIMEOUT) return false;
		}

		// Try to acquire lock
		const lockValue = JSON.stringify({ timestamp: now });
		localStorage.setItem(MIGRATE_LOCK_KEY, lockValue);

		// Verify lock acquired (race condition detection)
		await new Promise((resolve) => setTimeout(resolve, 10));
		return localStorage.getItem(MIGRATE_LOCK_KEY) === lockValue;
	} catch {
		return false;
	}
}

/**
 * Wait for migration to complete
 */
async function waitForMigration() {
	const startTime = Date.now();

	while (Date.now() - startTime < TIMEOUT) {
		try {
			const status = localStorage.getItem(MIGRATE_STATUS_KEY);
			if (status === "completed") return;
			if (status === "failed") throw new Error("Migration failed in another tab");
		} catch (error) {
			if (error instanceof Error) throw error;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	throw new Error("Migration timeout");
}

/**
 * Run database migrations with cross-tab synchronization
 */
async function runMigrations(db: DrizzleDb) {
	if (migratePromise) return migratePromise;

	migratePromise = (async () => {
		const hasLock = await acquireMigrateLock();

		if (hasLock) {
			// This tab will run migrations
			try {
				localStorage.setItem(MIGRATE_STATUS_KEY, "initializing");

				await migrate(db as any, { migrations: await getMigrations() });

				localStorage.setItem(MIGRATE_STATUS_KEY, "completed");
			} catch (error) {
				localStorage.setItem(MIGRATE_STATUS_KEY, "failed");
				throw error;
			} finally {
				localStorage.removeItem(MIGRATE_LOCK_KEY);
			}
		} else {
			await waitForMigration();
		}
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
			localStorage.removeItem(MIGRATE_LOCK_KEY);
		} catch {}
	});
}
