import { GQLVariable, useSingleTenantMutation } from '../../lib'

const CHANGE_PASSWORD_MUTATION = `
	changeMyPassword(
		currentPassword: $currentPassword,
		newPassword: $newPassword
	) {
		ok
		error {
			code
			developerMessage
		}
	}
`

const changePasswordVariables = {
	currentPassword: GQLVariable.Required(GQLVariable.String),
	newPassword: GQLVariable.Required(GQLVariable.String),
}

export type ChangePasswordErrors =
	| 'TOO_WEAK'
	| 'NOT_A_PERSON'
	| 'INVALID_PASSWORD'

export const useChangePassword = () => {
	return useSingleTenantMutation<never, ChangePasswordErrors, typeof changePasswordVariables>(
		CHANGE_PASSWORD_MUTATION,
		changePasswordVariables,
	)
}
