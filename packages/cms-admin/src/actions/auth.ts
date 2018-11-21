import { createAction } from 'redux-actions'
import { SET_ERROR, SET_LOADING, SET_LOGOUT, SET_TOKEN } from '../reducer/auth'
import { pushRequest } from './request'
import { ActionCreator } from './types'

export const login = (email: string, password: string): ActionCreator => async (dispatch, getState, services) => {
	dispatch(createAction(SET_LOADING)())
	const { signIn } = await services.tenantClient.request(loginMutation, { email, password }, services.config.loginToken)
	if (signIn.ok) {
		dispatch(createAction(SET_TOKEN, () => signIn.result.token)())
		dispatch(pushRequest(() => ({ name: 'projects_list' })))
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

export const logout = (): ActionCreator => (dispatch, getState, services) => {
	dispatch(createAction(SET_LOGOUT)())
	dispatch(pushRequest(() => ({ name: 'login' })))
}
