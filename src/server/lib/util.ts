export function base64ToDataURI(base64: string, fmt = "png") {
	return `data:image/${fmt};base64,${base64}`;
}

export function base64ToBlob(base64: string, mimeType = "image/png") {
	const byteString = atob(base64);
	const arrayBuffer = new ArrayBuffer(byteString.length);
	const uint8Array = new Uint8Array(arrayBuffer);
	for (let i = 0; i < byteString.length; i++) {
		uint8Array[i] = byteString.charCodeAt(i);
	}
	return new Blob([arrayBuffer], { type: mimeType });
}

export function dataURItoBase64(dataURI: string) {
	return dataURI.split(",")[1]!;
}

export async function readableStreamToDataURI(stream: ReadableStream<Uint8Array>, fmt = "png") {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];

	while (true) {
		const result = await reader.read();
		if (result.done) break;
		chunks.push(result.value);
	}

	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const mergedArray = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(chunk, offset);
		offset += chunk.length;
	}

	let binaryString = "";
	for (let i = 0; i < mergedArray.length; i++) {
		binaryString += String.fromCharCode(mergedArray[i]!);
	}
	const base64 = btoa(binaryString);

	return base64ToDataURI(base64, fmt);
}

export async function fetchUrlToDataURI(url: string) {
	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`Failed to fetch URL: ${url}, status: ${resp.status}`);
	}

	const arrayBuffer = await resp.arrayBuffer();
	// Convert ArrayBuffer to base64 using browser-compatible method
	const uint8Array = new Uint8Array(arrayBuffer);
	const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join("");
	const base64 = btoa(binaryString);
	return base64ToDataURI(base64);
}
