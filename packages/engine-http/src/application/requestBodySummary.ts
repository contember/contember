import { createHash } from 'node:crypto'

export type RequestBodySummary = {
	readonly operationName: string | null
	readonly queryHash: string
}

/**
 * What logs and error reports may say about a request body. Bodies carry passwords, OTP codes and tokens, so only
 * a GraphQL operation name and the query hash leave the process; the hash matches the one GraphQL execution logs.
 */
export const summarizeRequestBody = (body: unknown): RequestBodySummary | undefined => {
	if (typeof body !== 'object' || body === null || !('query' in body) || typeof body.query !== 'string') {
		return undefined
	}
	const operationName = 'operationName' in body && typeof body.operationName === 'string' ? body.operationName : null
	return {
		operationName,
		queryHash: createHash('md5').update(body.query).digest('hex'),
	}
}
