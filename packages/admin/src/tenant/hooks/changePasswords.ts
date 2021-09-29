import { getTenantErrorMessage } from '@contember/client'
import { useCallback, useMemo } from 'react'
import { useAuthedTenantMutation } from './lib'
import { useIdentity } from '../../components'

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
	state: 'success' | 'error' | 'loading' | 'initial'
	errors: string[]
}

export const useChangePassword = (): [(password: string) => void, ReturnedState] => {
	const auth = useIdentity()
	const personId = auth ? auth.personId : undefined
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
			state: state.state === 'success' && !state.data.changePassword.ok ? 'error' : state.state,
			errors: state.state === 'success' ? state.data.changePassword.errors.map(it => getTenantErrorMessage(it.code)) : [],
		}
	}, [state])
	return [changePassword, returnState]
}
