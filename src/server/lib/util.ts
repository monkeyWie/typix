export function buildDataURI(base64: string, fmt = "png"): string {
	return `data:image/${fmt};base64,${base64}`;
}

export function buildDataURIArray(base64Array: string[], fmt = "png"): string[] {
	return base64Array.map((base64) => buildDataURI(base64, fmt));
}

export async function fetchUrlToDataURI(url: string): Promise<string> {
	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`Failed to fetch URL: ${url}, status: ${resp.status}`);
	}

	const arrayBuffer = await resp.arrayBuffer();
	// Convert ArrayBuffer to base64 using browser-compatible method
	const uint8Array = new Uint8Array(arrayBuffer);
	const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join("");
	const base64 = btoa(binaryString);
	return buildDataURI(base64);
}
