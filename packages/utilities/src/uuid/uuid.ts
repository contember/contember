const hex: string[] = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(1))

const formatUuid = (bytes: Uint8Array): string =>
	hex[bytes[0]] + hex[bytes[1]] + hex[bytes[2]] + hex[bytes[3]] + '-'
	+ hex[bytes[4]] + hex[bytes[5]] + '-'
	+ hex[bytes[6]] + hex[bytes[7]] + '-'
	+ hex[bytes[8]] + hex[bytes[9]] + '-'
	+ hex[bytes[10]] + hex[bytes[11]] + hex[bytes[12]] + hex[bytes[13]] + hex[bytes[14]] + hex[bytes[15]]

const randomBytes = (): Uint8Array => crypto.getRandomValues(new Uint8Array(16))

// crypto.randomUUID exists only in secure contexts; getRandomValues works everywhere.
export const generateUuidV4 = (): string => {
	if (typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	const bytes = randomBytes()
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return formatUuid(bytes)
}

const v7State = { msecs: -Infinity, seq: 0 }

/**
 * RFC 9562 UUIDv7, monotonic within the process: inside one millisecond (or when the clock goes back)
 * a random-seeded 32-bit counter increments; when it wraps, the timestamp moves forward by one millisecond.
 */
export const generateUuidV7 = (now: number = Date.now()): string => {
	const bytes = randomBytes()
	if (now > v7State.msecs) {
		v7State.seq = (bytes[6] << 23) | (bytes[7] << 16) | (bytes[8] << 8) | bytes[9]
		v7State.msecs = now
	} else {
		v7State.seq = (v7State.seq + 1) | 0
		if (v7State.seq === 0) {
			v7State.msecs++
		}
	}
	const { msecs, seq } = v7State
	bytes[0] = (msecs / 0x10000000000) & 0xff
	bytes[1] = (msecs / 0x100000000) & 0xff
	bytes[2] = (msecs / 0x1000000) & 0xff
	bytes[3] = (msecs / 0x10000) & 0xff
	bytes[4] = (msecs / 0x100) & 0xff
	bytes[5] = msecs & 0xff
	bytes[6] = 0x70 | ((seq >>> 28) & 0x0f)
	bytes[7] = (seq >>> 20) & 0xff
	bytes[8] = 0x80 | ((seq >>> 14) & 0x3f)
	bytes[9] = (seq >>> 6) & 0xff
	bytes[10] = ((seq << 2) & 0xff) | (bytes[10] & 0x03)
	return formatUuid(bytes)
}

const uuidPattern =
	/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i

/** Accepts RFC 9562 versions 1-8 plus the nil and max UUIDs, case-insensitively. */
export const isUuid = (value: string): boolean => uuidPattern.test(value)
