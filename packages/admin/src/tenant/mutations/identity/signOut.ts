import { useAuthedTenantMutation, UseMutationReturn } from '../../lib'

const SIGNOUT_MUTATION = `
	mutation {
		signOut {
			ok
			error {
				code
				endUserMessage
			}
		}
	}
`

export type SignOutResponse = SignOutResponseOk | SignOutResponseError

export interface SignOutResponseOk {
	signOut: {
		ok: true
	}
}

export interface SignOutResponseError {
	signOut: {
		ok: false
		error?: {
			code: string
			endUserMessage?: string
		}
	}
}

export const useSignOut = (): UseMutationReturn<SignOutResponse, {}> => {
	return useAuthedTenantMutation(SIGNOUT_MUTATION)
}
