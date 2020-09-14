export interface InitIDPAuthResult<SessionData extends {}> {
	authUrl: string
	sessionData: SessionData
}

export interface IDPResponse {
	url: string
}

export interface IDPClaim {
	email: string
}

export interface IdentityProvider<SessionData extends {}, Configuration extends {}> {
	initAuth(configuration: Configuration, redirectUrl: string): Promise<InitIDPAuthResult<SessionData>>

	processResponse(
		configuration: Configuration,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: SessionData,
	): Promise<IDPClaim>

	validateConfiguration(config: unknown): Configuration
}
