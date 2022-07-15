export interface IdentityProviderData {
	type: string
	slug: string
	configuration: Record<string, any>
	options: IdentityProviderOptions
}

export interface IdentityProviderOptions {
	autoSignUp: boolean
	exclusive: boolean
}
