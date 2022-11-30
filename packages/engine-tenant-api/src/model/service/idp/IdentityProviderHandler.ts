export interface InitIDPAuthResult<SessionData extends {}> {
	authUrl: string
	sessionData: SessionData
}

export interface IDPClaim {
	externalIdentifier: string
	email?: string
	name?: string
}

export interface IdentityProviderHandler<SessionData extends {}, ResponseData extends {}, Configuration extends {}> {

	initAuth(configuration: Configuration, redirectUrl: string): Promise<InitIDPAuthResult<SessionData>>

	processResponse(configuration: Configuration, responseData: ResponseData): Promise<IDPClaim>

	validateResponseData(data: unknown): ResponseData

	validateConfiguration(config: unknown): Configuration
}
