export interface InitIDPAuthResult {
	authUrl: string
	sessionData: unknown
}

/**
 * Provider-specific federated-session state persisted alongside a Contember session
 * (see the `idp_session` table) so the session can be re-validated against the IdP
 * after the initial sign-in. Opaque to the core — only the owning provider's
 * `revalidate` interprets `tokens`. Token material is encrypted at rest.
 */
export type IDPSessionState = {
	/** OIDC `sid` claim / SAML `SessionIndex`, when the IdP provides one. */
	sessionId?: string
	/** Provider-specific token payload (e.g. OIDC refresh/id token). Encrypted at rest. */
	tokens?: Record<string, unknown>
	/** IdP-asserted absolute expiry of the federated session, if known. */
	expiresAt?: Date
}

export type IDPResponse = {
	externalIdentifier: string
	email?: string
	name?: string
	/** Whether the provider asserts the e-mail address is verified (OIDC `email_verified`). */
	emailVerified?: boolean
	/**
	 * Federated-session state to persist for continuous re-validation. Present only when
	 * the provider supports it and revalidation is enabled on the IdP configuration;
	 * otherwise undefined and the session behaves like a plain password session.
	 */
	idpSession?: IDPSessionState
} & Record<string, unknown>

/** Outcome of a federated-session re-validation against the IdP. */
export type RevalidationResult =
	| {
		status: 'valid'
		/** Fresh claims, if the revalidation method returned any (e.g. userinfo). */
		claims?: Record<string, unknown>
		/** Updated session state to persist (e.g. a rotated refresh token). */
		idpSession?: IDPSessionState
	}
	| {
		status: 'revoked'
		reason: string
	}

export interface IdentityProviderHandler<Configuration extends {}> {
	initAuth: (configuration: Configuration, data: unknown) => Promise<InitIDPAuthResult>

	processResponse: (configuration: Configuration, responseData: unknown) => Promise<IDPResponse>

	validateConfiguration: (config: unknown) => Configuration

	getPublicConfiguration?: (config: Configuration) => Partial<Configuration>

	/**
	 * Re-validate a previously established federated session against the IdP.
	 * Present only on providers that support continuous re-validation (OIDC); absent on
	 * providers that cannot (Apple, Facebook, SAML — which rely on a short max lifetime + SLO).
	 */
	revalidate?: (configuration: Configuration, session: IDPSessionState) => Promise<RevalidationResult>
}
