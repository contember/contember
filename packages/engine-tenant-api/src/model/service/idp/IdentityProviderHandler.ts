export interface InitIDPAuthResult {
	authUrl: string
	sessionData: unknown
}

export interface IDPClaim {
	externalIdentifier: string
	email?: string
	name?: string
}

export interface IdentityProviderHandler<Configuration extends {}> {

	initAuth: (configuration: Configuration, data: unknown) => Promise<InitIDPAuthResult>

	processResponse: (configuration: Configuration, responseData: unknown) =>  Promise<IDPClaim>

	validateConfiguration: (config: unknown) => Configuration

	getPublicConfiguration?: (config: Configuration) => Partial<Configuration>
}
