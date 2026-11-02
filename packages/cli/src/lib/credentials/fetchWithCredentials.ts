import type { CredentialsProvider } from '@contember/graphql-client'

export interface CredentialedRequestInit extends Omit<RequestInit, 'headers'> {
	readonly method: string
	readonly headers: Record<string, string>
}

/**
 * A raw `fetch` authenticated right before it is sent, so a long run of requests picks up fresh tokens.
 * A 401 is retried once with a refreshed credential; the body must therefore be replayable (no stream).
 * Errors thrown by the credentials provider propagate unchanged — they are not network failures.
 */
export const fetchWithCredentials = async (
	credentials: CredentialsProvider,
	url: string,
	init: CredentialedRequestInit,
): Promise<Response> => {
	const send = async (refresh: boolean): Promise<Response> => {
		const authHeaders = await credentials.authenticate({ url, method: init.method, refresh })
		return await fetch(url, { ...init, headers: { ...init.headers, ...authHeaders } })
	}
	const response = await send(false)
	if (response.status !== 401) {
		return response
	}
	try {
		await response.body?.cancel()
	} catch {
		// The retried response is the primary outcome.
	}
	return await send(true)
}
