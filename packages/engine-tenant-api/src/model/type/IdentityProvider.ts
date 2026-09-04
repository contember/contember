export interface IdentityProviderData {
	type: string
	slug: string
	configuration: Record<string, any>
	options: IdentityProviderOptions
}

export interface IdentityProviderOptions {
	autoSignUp: boolean
	exclusive: boolean
	initReturnsConfig: boolean
	requireVerifiedEmail: boolean
	assumeEmailVerified: boolean
	/** A person linked to this provider may authenticate only through it. */
	disableLocalAuthentication: boolean
}
