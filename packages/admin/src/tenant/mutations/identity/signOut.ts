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

export const useSignOut = (): UseMutationReturn<SignOutResponse, {}> => {
	return useAuthedTenantMutation(SIGNOUT_MUTATION)
}
