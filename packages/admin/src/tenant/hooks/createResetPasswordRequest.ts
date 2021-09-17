import { GQLVariable, useSingleTenantMutation } from './lib/facade'
import { useLoginToken } from '@contember/react-client'
import { useMemo } from 'react'

const CREATE_RESET_PASSWORD_REQUEST_MUTATION = `
createResetPasswordRequest(email: $email) {
	ok
	error {
		code
		developerMessage
	}
}
`

const createResetPasswordRequestVariables = {
	email: GQLVariable.Required(GQLVariable.String),
}

export const useCreateResetPasswordRequest = () => {
	const loginToken = useLoginToken()
	return useSingleTenantMutation<never, 'PERSON_NOT_FOUND', typeof createResetPasswordRequestVariables>(
		CREATE_RESET_PASSWORD_REQUEST_MUTATION,
		createResetPasswordRequestVariables,
		useMemo(() => ({
			apiTokenOverride: loginToken,
		}), [loginToken]),
	)
}
