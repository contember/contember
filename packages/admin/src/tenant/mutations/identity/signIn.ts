import { useLoginToken } from '@contember/react-client'
import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { useMemo } from 'react'

const LOGIN_MUTATION = `
		signIn(email: $email, password: $password, expiration: $expiration, otpToken: $otpToken) {
			ok
			error {
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
`

const loginVariables = {
	email: GQLVariable.Required(GQLVariable.String),
	password: GQLVariable.Required(GQLVariable.String),
	expiration: GQLVariable.Int,
	otpToken: GQLVariable.String,
}

export type LoginErrors =
	| 'UNKNOWN_EMAIL'
	| 'INVALID_PASSWORD'
	| 'OTP_REQUIRED'
	| 'INVALID_OTP_TOKEN'

export interface LoginResult {
	token: string
	person: {
		id: string
		email: string
	}
}

export const useSignIn = () => {
	const loginToken = useLoginToken()

	return useSingleTenantMutation<LoginResult, LoginErrors, typeof loginVariables>(LOGIN_MUTATION, loginVariables, useMemo(() => ({
		apiTokenOverride: loginToken,
		headers: {
			'X-Contember-Token-Path': 'data.result.result.token',
		},
	}), [loginToken]))
}

/** @deprecated */
export const useLogin = useSignIn
