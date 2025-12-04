import { type Storage, files } from "@/server/db/schemas";
import { inBrowser } from "@/server/lib/env";
import { base64ToDataURI, fetchUrlToDataURI } from "@/server/lib/util";
import { and, eq } from "drizzle-orm";
import { getContext } from "../context";

interface FileStorageLocalConfig {
	path: string;
}
interface FileStorageR2Config {
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint?: string;
}

export const fileStorage = inBrowser ? "base64" : (process.env.FILE_STORAGE as Storage) || "base64";

// const fileStorageConfig: Record<Storage, FileStorageLocalConfig | FileStorageR2Config | undefined> | undefined =
// 	inBrowser
// 		? undefined
// 		: {
// 				base64: undefined,
// 				disk: {
// 					path: process.env.FILE_STORAGE_DISK_PATH,
// 				},
// 				/* r2: {
// 					bucket: process.env.FILE_STORAGE_R2_BUCKET || "",
// 					accessKeyId: process.env.FILE_STORAGE_R2_ACCESS_KEY_ID || "",
// 					secretAccessKey: process.env.FILE_STORAGE_R2_SECRET_ACCESS_KEY || "",
// 					endpoint: process.env.FILE_STORAGE_R2_ENDPOINT,
// 				}, */
// 			};

const storageHandlers: Record<
	Storage,
	{
		/**
		 * Save a file to the storage
		 * @param fileData Base64 encoded file data
		 * @param userId
		 * @returns
		 */
		save: (fileData: string, userId: string) => Promise<string>;
		/**
		 * Get a file URL or path from the storage
		 * @param file File record from the database
		 * @param userId User ID to check access
		 * @returns URL or path to the file, or null if not found
		 */
		get: (file: typeof files.$inferSelect, userId: string) => Promise<string | null>;
	}
> = {
	base64: {
		save: async (fileData, userId) => {
			return fileData;
		},
		get: async (file, userId) => {
			return file.url;
		},
	},
	disk: {
		save: async (fileData, userId) => {
			return fileData;
		},
		get: async (file, userId) => {
			return null;
		},
	},
	/* 	r2: {
		save: async (fileData, userId) => {
			return fileData;
		},
		get: async (file, userId) => {
			return null;
		},
	}, */
};

export const saveFiles = async (fileDatas: string[], userId: string) => {
	const { db } = getContext();

	const filesSave = await db
		.insert(files)
		.values(
			await Promise.all(
				fileDatas.map(async (file) => ({
					userId,
					storage: fileStorage,
					url: await storageHandlers[fileStorage].save(file, userId),
				})),
			),
		)
		.returning();

	return filesSave.map((f) => f.id);
};

export const getFileMetadata = async (fileId: string, userId: string) => {
	const { db } = getContext();

	const file = await db.query.files.findFirst({
		where: and(eq(files.id, fileId), eq(files.userId, userId)),
	});
	if (!file) {
		return null;
	}

	const accessUrl = await storageHandlers[file.storage].get(file, userId);
	if (!accessUrl) {
		return null;
	}

	const protocol = new URL(accessUrl).protocol;
	return {
		file,
		protocol,
		accessUrl,
	};
};

/**
 * Get file base64 data URL
 * @param fileId File ID to get data for
 * @param userId User ID to check access
 * @param redirect
 * @returns
 */
export const getFileData = async (fileId: string, userId: string) => {
	const metadata = await getFileMetadata(fileId, userId);
	if (!metadata) {
		return null;
	}

	if (inBrowser) {
		return await storageHandlers.base64.get(metadata.file, userId);
	}

	switch (metadata.protocol) {
		case "data:":
			return metadata.accessUrl;
		case "file:": {
			const fs = await import("node:fs/promises");
			const fileSuffix = metadata.accessUrl.split(".").pop();
			return base64ToDataURI(await fs.readFile(metadata.accessUrl, "base64"), fileSuffix);
		}
		default:
			return await fetchUrlToDataURI(metadata.accessUrl);
	}
};

export const getFileUrl = async (fileId: string, userId: string) => {
	const metadata = await getFileMetadata(fileId, userId);
	if (!metadata) {
		return null;
	}

	if (inBrowser) {
		return await storageHandlers.base64.get(metadata.file, userId);
	}

	return `/api/files/preview/${metadata.file.id}`;
};
