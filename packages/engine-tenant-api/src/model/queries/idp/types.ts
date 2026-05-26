import { IdentityProviderData } from '../../type/index.js'

export type IdentityProviderRow = {
	id: string
	slug: string
	type: string
	disabledAt: Date | null
	configuration: Record<string, unknown>
	autoSignUp: boolean
	exclusive: boolean
	initReturnsConfig: boolean
	requireVerifiedEmail: boolean
}

export type IdentityProviderDto =
	& {
		id: string
		disabledAt: Date | null
	}
	& IdentityProviderData
