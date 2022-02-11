export interface IdentityProvider {
	type: string
	slug: string
	configuration: Record<string, any>
}
