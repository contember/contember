import { useAuthedTenantMutation, UseMutationReturn } from './lib'

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

type SignOutResponse = SignOutResponseOk | SignOutResponseError

interface SignOutResponseOk {
	signOut: {
		ok: true
	}
}

interface SignOutResponseError {
	signOut: {
		ok: false
		error?: {
			code: string
			endUserMessage?: string
		}
	}
}

interface SignOutVariables {}

export const useSignOut = (): UseMutationReturn<SignOutResponse, SignOutVariables> => {
	return useAuthedTenantMutation(SIGNOUT_MUTATION)
}
