import crypto from 'node:crypto'

export const viewComputedId = (inputs: (string)[]): string => {
	let uuidBytes: Buffer
	uuidBytes = crypto.createHash('md5').update(inputs.join('\x00')).digest()

	// Set the version (v8) in the high nibble of byte 6.
	uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x80 // 0x80 = 1000 0000 (version 8)

	// Set the variant (RFC 4122) in byte 8.
	uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80

	return formatUUID(uuidBytes)
}

const formatUUID = (buf: Buffer): string => {
	const hex = buf.toString('hex')
	return hex.substring(0, 8)
		+ '-' + hex.substring(8, 12)
		+ '-' + hex.substring(12, 16)
		+ '-' + hex.substring(16, 20)
		+ '-' + hex.substring(20)
}
