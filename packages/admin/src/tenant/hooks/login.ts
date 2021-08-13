import { useMutation, UseMutationReturn } from './lib'
import { useLoginToken, useTenantGraphQlClient } from '@contember/react-client'

const LOGIN_MUTATION = `
	mutation($email: String!, $password: String!, $expiration: Int) {
		signIn(email: $email, password: $password, expiration: $expiration) {
			ok
			errors {
				code
				endUserMessage
			}
			result {
				token
				person {
					id
					email
				}
			}
		}
	}
`

type LoginResponse = LoginResponseOk | LoginResponseError

interface LoginResponseOk {
	signIn: {
		ok: true
		result: {
			token: string
			person: {
				id: string
				email: string
			}
		}
	}
}

interface LoginResponseError {
	signIn: {
		ok: false
		errors: Array<{
			code: string
			endUserMessage?: string
		}>
	}
}

interface LoginVariables {
	email: string
	password: string
	expiration: number
}

export const useLogin = (): UseMutationReturn<LoginResponse, LoginVariables> => {
	const loginToken = useLoginToken()
	const tenantClient = useTenantGraphQlClient()

	return useMutation(tenantClient, LOGIN_MUTATION, loginToken, {
		'X-Contember-Token-Path': 'data.signIn.result.token',
	})
}
