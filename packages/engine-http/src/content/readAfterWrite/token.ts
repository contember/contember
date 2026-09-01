const maxTokens = 16
const tokenFormat = /^\d{1,20}:\d{1,20}$/
/** 0, 1 and 2 are reserved xid8 values, never a real transaction. */
const minXid = 3n
const maxXid = 2n ** 64n - 1n

export type ReadAfterTokens =
	| {
		readonly valid: true
		/** The tokens as sent, deduplicated and in request order. */
		readonly tokens: string[]
		/** The xid8 part of each token, in the same order. */
		readonly xids: string[]
	}
	| {
		readonly valid: false
		readonly tokens: string[]
		readonly xids: []
	}

/**
 * Parses the X-Contember-Read-After header. `null` means "no header" (route as usual); an invalid
 * result means the tokens cannot be checked here (route to the primary, acknowledge nothing).
 * The whole header is rejected as one, so a client cannot mix a foreign token in to weaken the check.
 */
export const parseReadAfterHeader = (value: string | undefined, clusterId: string): ReadAfterTokens | null => {
	if (value === undefined) {
		return null
	}
	const tokens = [...new Set(value.split(',').map(it => it.trim()).filter(it => it !== ''))]
	if (tokens.length === 0) {
		return null
	}
	const invalid: ReadAfterTokens = { valid: false, tokens, xids: [] }
	if (tokens.length > maxTokens) {
		return invalid
	}
	const xids: string[] = []
	for (const token of tokens) {
		if (!tokenFormat.test(token)) {
			return invalid
		}
		const separator = token.indexOf(':')
		if (token.slice(0, separator) !== clusterId) {
			return invalid
		}
		const xid = token.slice(separator + 1)
		const numeric = BigInt(xid)
		if (numeric < minXid || numeric > maxXid) {
			return invalid
		}
		xids.push(xid)
	}
	return { valid: true, tokens, xids }
}
