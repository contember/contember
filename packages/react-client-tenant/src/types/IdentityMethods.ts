export interface IdentityMethods {
	clearIdentity: () => void
	refreshIdentity: () => Promise<void>
}
