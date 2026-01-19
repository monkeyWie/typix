import type { ErrorReason } from "../db/schemas";

export type StrictOmit<T, K extends keyof T> = Omit<T, K>;
export type ReplacePropertyType<T, K extends keyof T, NewType> = {
	[P in keyof T]: P extends K ? NewType : T[P];
};
export class GenError extends Error {
	reason: ErrorReason;

	constructor(reason: ErrorReason) {
		super(reason);
		this.reason = reason;
	}
}
