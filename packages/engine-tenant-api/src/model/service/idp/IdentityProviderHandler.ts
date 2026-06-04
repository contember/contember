export interface InitIDPAuthResult {
	authUrl: string
	sessionData: unknown
}

export type IDPResponse = {
	externalIdentifier: string
	email?: string
	name?: string
	/** Whether the provider asserts the e-mail address is verified (OIDC `email_verified`). */
	emailVerified?: boolean
} & Record<string, unknown>

export interface IdentityProviderHandler<Configuration extends {}> {
	initAuth: (configuration: Configuration, data: unknown) => Promise<InitIDPAuthResult>

	processResponse: (configuration: Configuration, responseData: unknown) => Promise<IDPResponse>

	validateConfiguration: (config: unknown) => Configuration

	getPublicConfiguration?: (config: Configuration) => Partial<Configuration>
}
