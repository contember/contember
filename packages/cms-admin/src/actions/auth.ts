import { ActionCreator } from './types'
import { createAction } from 'redux-actions'
import { SET_TOKEN, SET_ERROR, SET_LOADING } from '../reducer/auth'

export const login = (email: string, password: string): ActionCreator => async (dispatch, getState, services) => {
	dispatch(createAction(SET_LOADING)())
	const { signIn } = await services.tenantClient.request(loginMutation, { email, password })
	if (signIn.ok) {
		dispatch(createAction(SET_TOKEN, () => signIn.result.token)())
	} else {
		dispatch(
			createAction(SET_ERROR, () => signIn.errors.map((err: any) => err.endUserMessage || err.code).join(', '))()
		)
	}
}

const loginMutation = `
	mutation($email: String!, $password: String!) {
		signIn(email: $email, password: $password) {
			ok
			errors {
				endUserMessage
				code
			}
			result {
				token
			}
		}
	}
`
