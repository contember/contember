export interface CredentialsRequest {
	readonly url: string
	readonly method: string
	/** True on the single retry after a 401: the provider must not return a cached token. */
	readonly refresh: boolean
}

/**
 * Authenticates one request: returns `Authorization`, plus `DPoP` when the token is bound.
 * Called per request, so a provider caches its token and refreshes it before expiry.
 */
export interface CredentialsProvider {
	authenticate(request: CredentialsRequest): Promise<Record<string, string>>
}
