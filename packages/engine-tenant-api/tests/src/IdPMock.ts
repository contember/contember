import { IdentityProviderHandler, IDPResponse, InitIDPAuthResult, LogoutTokenClaims, LogoutUrlRequest } from '../../src/index.js'

export class IdPMock implements IdentityProviderHandler<any> {
	initAuth(configuration: any, data: unknown): Promise<InitIDPAuthResult> {
		return Promise.resolve({
			authUrl: 'http://localhost',
			sessionData: { foo: 'bar' },
		})
	}

	processResponse(configuration: any, responseData: any): Promise<IDPResponse> {
		return Promise.resolve({
			externalIdentifier: configuration.externalIdentifier,
			email: configuration.email,
			emailVerified: configuration.emailVerified,
			// Surface any extra claims configured on the mock (e.g. `groups`, `department`) verbatim,
			// mirroring how real providers spread raw OIDC claims into the IDPResponse — lets tests
			// drive claim-mapping (A09). `claimMapping` itself lives on the IdP config, not here.
			...(configuration.claims ?? {}),
		})
	}

	validateConfiguration(config: unknown): any {
		return config
	}

	/**
	 * Test double for OIDC RP-initiated logout. Returns a deterministic URL built from the config's
	 * `endSessionEndpoint` (null when absent, mirroring an IdP without an `end_session_endpoint`).
	 */
	buildLogoutUrl(configuration: any, request: LogoutUrlRequest): Promise<string | null> {
		if (!configuration?.endSessionEndpoint) {
			return Promise.resolve(null)
		}
		const params = new URLSearchParams()
		if (request.idToken) {
			params.set('id_token_hint', request.idToken)
		}
		if (request.postLogoutRedirectUri) {
			params.set('post_logout_redirect_uri', request.postLogoutRedirectUri)
		}
		const query = params.toString()
		return Promise.resolve(query ? `${configuration.endSessionEndpoint}?${query}` : configuration.endSessionEndpoint)
	}

	/**
	 * Test double for OIDC back-channel logout token validation. A token of the form `sid:<value>`
	 * or `sub:<value>` is treated as valid and decoded; anything else throws (invalid token).
	 */
	validateLogoutToken(configuration: any, logoutToken: string): Promise<LogoutTokenClaims> {
		if (logoutToken.startsWith('sid:')) {
			return Promise.resolve({ sid: logoutToken.slice('sid:'.length) })
		}
		if (logoutToken.startsWith('sub:')) {
			return Promise.resolve({ sub: logoutToken.slice('sub:'.length) })
		}
		return Promise.reject(new Error('invalid logout token'))
	}
}
