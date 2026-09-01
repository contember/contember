export const writeRefHeader = 'X-Contember-Write-Ref'
export const readAfterHeader = 'X-Contember-Read-After'
export const readAfterVisibleHeader = 'X-Contember-Read-After-Visible'

/** `<system_identifier>:<xid8>`, both decimal. */
export const writeRefFormat = /^\d+:\d+$/

/**
 * Reads the write ref of a mutation response. The engine only offers read-after-write when the
 * project has a read replica configured, so a missing header usually means DEFAULT_DB_READ_HOST.
 */
export const requireWriteRef = (value: string | undefined): string => {
	if (value === undefined || value === '') {
		throw new Error(`Missing ${writeRefHeader}. Read-after-write needs a read replica on the engine (DEFAULT_DB_READ_HOST).`)
	}
	if (!writeRefFormat.test(value)) {
		throw new Error(`Malformed ${writeRefHeader}: ${value}`)
	}
	return value
}
