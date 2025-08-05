export type Code = "ok" | "error" | "not_found" | "unauthorized" | "forbidden" | "invalid_parameter";

export class ServiceException extends Error {
	readonly code: Code;

	constructor(code: Code, message: string) {
		super(message);
		this.code = code;
	}
}
