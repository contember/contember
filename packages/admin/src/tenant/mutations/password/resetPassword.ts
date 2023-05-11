import { GQLVariable, useSingleTenantMutation } from '../../lib'
import { useLoginToken } from '@contember/react-client'
import { useMemo } from 'react'

const RESET_PASSWORD_MUTATION = `
resetPassword(token: $token, password: $password) {
	ok
	error {
		code
		developerMessage
	}
}
`

const resetPasswordVariables = {
	token: GQLVariable.Required(GQLVariable.String),
	password: GQLVariable.Required(GQLVariable.String),
}

export type PasswordResetErrors =
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'
	| 'TOKEN_EXPIRED'
	| 'PASSWORD_TOO_WEAK'

export const useResetPassword = () => {
	const loginToken = useLoginToken()
	return useSingleTenantMutation<never, PasswordResetErrors, typeof resetPasswordVariables>(
		RESET_PASSWORD_MUTATION,
		resetPasswordVariables,
		useMemo(() => ({
			apiTokenOverride: loginToken,
		}), [loginToken]),
	)
}
