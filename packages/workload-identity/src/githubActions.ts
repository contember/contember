import { CredentialsProvider } from '@contember/graphql-client'
import { TokenCache } from './TokenCache.js'

export interface GithubActionsOptions {
	/** The trust's audience; requested from the GitHub OIDC endpoint per token. */
	readonly audience: string
	/** Defaults to `process.env`; reads `ACTIONS_ID_TOKEN_REQUEST_URL` / `ACTIONS_ID_TOKEN_REQUEST_TOKEN`. */
	readonly env?: Readonly<Record<string, string | undefined>>
	readonly fetch?: (input: string, init?: RequestInit) => Promise<Response>
}

/**
 * Tokens from the GitHub Actions OIDC endpoint; never written to env or disk.
 * Throws when the job cannot request tokens (`permissions: id-token: write` missing).
 */
export const githubActions = (options: GithubActionsOptions): CredentialsProvider => {
	if (options.audience === '') {
		throw new Error('githubActions: `audience` must not be empty.')
	}
	const env = options.env ?? process.env
	const requestUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL
	const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
	if (!requestUrl || !requestToken) {
		throw new Error(
			'githubActions: ACTIONS_ID_TOKEN_REQUEST_URL / ACTIONS_ID_TOKEN_REQUEST_TOKEN are not set. '
				+ 'Run inside a GitHub Actions job with `permissions: id-token: write`.',
		)
	}
	const fetcher = options.fetch ?? ((input: string, init?: RequestInit) => fetch(input, init))

	const cache = new TokenCache('githubActions', async () => {
		// The request URL already carries a query string; this mirrors `@actions/core`.
		const response = await fetcher(`${requestUrl}&audience=${encodeURIComponent(options.audience)}`, {
			headers: { Authorization: `bearer ${requestToken}`, Accept: 'application/json' },
		})
		if (!response.ok) {
			throw new Error(`githubActions: the OIDC token request failed with HTTP ${response.status}.`)
		}
		return parseTokenResponse(await response.text())
	})

	return {
		authenticate: async ({ refresh }) => ({ Authorization: `Bearer ${await cache.get(refresh)}` }),
	}
}

const parseTokenResponse = (body: string): string => {
	let parsed: unknown
	try {
		parsed = JSON.parse(body)
	} catch (cause) {
		throw new Error('githubActions: the OIDC token response is not JSON.', { cause })
	}
	if (typeof parsed !== 'object' || parsed === null || !('value' in parsed) || typeof parsed.value !== 'string' || parsed.value === '') {
		throw new Error('githubActions: the OIDC token response has no `value`.')
	}
	return parsed.value
}
