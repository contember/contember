const HEX_DIGITS = '0123456789abcdef'

const randomHex = (byteLength: number): string => {
	const bytes = new Uint8Array(byteLength)
	globalThis.crypto.getRandomValues(bytes)
	let result = ''
	for (const byte of bytes) {
		result += HEX_DIGITS[byte >> 4] + HEX_DIGITS[byte & 0x0f]
	}
	return result
}

export const INVALID_TRACE_ID = '0'.repeat(32)

export const INVALID_SPAN_ID = '0'.repeat(16)

export const generateTraceId = (): string => randomHex(16)

export const generateSpanId = (): string => randomHex(8)
