import { IncomingMessage } from 'node:http'

/**
 * Opt-in mechanism to coerce the HTTP status of a GraphQL API response to 200.
 *
 * Some GraphQL clients cannot properly handle non-200 HTTP status codes (e.g. on
 * authentication failure). When a request carries the `X-Contember-Force-Ok` header
 * with a truthy value, the response status is forced to 200 while the error information
 * remains in the JSON body.
 *
 * This is scoped to the GraphQL API endpoints (content/tenant/system) where a JSON body
 * with `errors`/`data` is returned, so that fatal/non-JSON responses are not mislabeled.
 *
 * The capability can be disabled globally via the `http.responseStatusHeader` config flag.
 */
export const forceHttpOkHeader = 'x-contember-force-ok'

const graphqlModules = new Set(['content', 'tenant', 'system'])

const truthyValues = new Set(['1', 'true', 'on', 'yes'])

export const isForceHttpOkRequested = (request: IncomingMessage): boolean => {
	const raw = request.headers[forceHttpOkHeader]
	const value = Array.isArray(raw) ? raw[0] : raw
	if (value === undefined) {
		return false
	}
	return truthyValues.has(value.trim().toLowerCase())
}

export const isGraphqlModule = (module: string | undefined): boolean => module !== undefined && graphqlModules.has(module)

export interface ForceHttpOkDecisionInput {
	/** Whether the capability is enabled in config (http.responseStatusHeader). */
	enabled: boolean
	/** The current HTTP response status. */
	status: number
	/** The matched route module, if any. */
	module: string | undefined
	/** Whether the response carries a (JSON) body. */
	hasBody: boolean
	/** Whether the client requested coercion via the X-Contember-Force-Ok header. */
	headerRequested: boolean
}

/**
 * Pure decision for whether a response status should be coerced to 200.
 *
 * Coercion happens only when ALL of the following hold:
 * - the capability is enabled in config (kill-switch off),
 * - the status is not already 200,
 * - the matched module is a GraphQL API module (content/tenant/system),
 * - the response has a body (so non-JSON / transport responses are not mislabeled),
 * - the client opted in via the X-Contember-Force-Ok header.
 */
export const shouldForceHttpOk = ({ enabled, status, module, hasBody, headerRequested }: ForceHttpOkDecisionInput): boolean => {
	if (!enabled) {
		return false
	}
	if (status === 200) {
		return false
	}
	if (!isGraphqlModule(module)) {
		return false
	}
	if (!hasBody) {
		return false
	}
	return headerRequested
}
