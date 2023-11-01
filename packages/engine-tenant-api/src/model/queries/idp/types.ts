import { IdentityProviderData } from '../../type'

export type IdentityProviderRow = {
	id: string
	slug: string
	type: string
	disabledAt: Date | null
	configuration: Record<string, unknown>
	autoSignUp: boolean
	exclusive: boolean
	initReturnsConfig: boolean
}

export type IdentityProviderDto =
	& {
		id: string
		disabledAt: Date | null
	}
	& IdentityProviderData
