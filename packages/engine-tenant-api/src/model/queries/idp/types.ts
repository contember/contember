export type IdentityProviderRow = {
	id: string
	slug: string
	type: string
	disabledAt: Date | unknown
	configuration: Record<string, unknown>
	autoSignUp: boolean
}
