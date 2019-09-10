import { useAuth, useAuthedTenantMutation } from './lib'
import { useCallback, useMemo } from 'react'

const CHANGE_PASSWORD_MUTATION = `
	mutation(
		$personId: String!, 
		$password: String!
	) {
		changePassword(
			personId: $personId,
			password: $password
		) {
			ok
			errors {
				code
				endUserMessage
			}
		}
	}
`

interface ChangePasswordResponse {
	changePassword: {
		ok: boolean
		errors: {
			code: string
			endUserMessage?: string
		}[]
	}
}

interface ChangePasswordVariables {
	personId: string
	password: string
}

interface ReturnedState {
	finished: boolean
	success: boolean
	loading: boolean
	errors: string[]
}

export const useChangePassword = (): [(password: string) => void, ReturnedState] => {
	const auth = useAuth()
	const personId = auth != null ? auth.personId : undefined
	const [triggerChangePassword, state] = useAuthedTenantMutation<ChangePasswordResponse, ChangePasswordVariables>(
		CHANGE_PASSWORD_MUTATION,
	)
	const changePassword = useCallback(
		(newPassword: string) => {
			if (personId !== undefined) {
				triggerChangePassword({
					password: newPassword,
					personId: personId,
				})
			}
		},
		[triggerChangePassword, personId],
	)
	const returnState = useMemo<ReturnedState>(() => {
		return {
			success: state.finished && !state.error && state.data.changePassword.ok,
			finished: state.finished,
			loading: state.loading,
			errors:
				(state.finished && !state.error && state.data.changePassword.errors.map(it => it.endUserMessage || it.code)) ||
				[],
		}
	}, [state])
	return [changePassword, returnState]
}
