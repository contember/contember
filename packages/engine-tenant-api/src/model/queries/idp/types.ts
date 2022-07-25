import { IdentityProviderData } from '../../type'

export type IdentityProviderRow = {
	id: string
	slug: string
	type: string
	disabledAt: Date | unknown
	configuration: Record<string, unknown>
	autoSignUp: boolean
	exclusive: boolean
}

export type IdentityProviderDto =
	& {
		id: string
		disabledAt: Date | unknown
	}
	& IdentityProviderData
