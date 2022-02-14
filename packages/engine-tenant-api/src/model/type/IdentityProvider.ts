export interface IdentityProvider {
	type: string
	slug: string
	configuration: Record<string, any>
	options: IdentityProviderOptions
}

export interface IdentityProviderOptions {
	autoSignUp: boolean
}
