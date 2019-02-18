import { createAction } from 'redux-actions'
import { SET_ERROR, SET_IDENTITY, SET_LOADING, SET_LOGOUT } from '../reducer/auth'
import { pushRequest } from './request'
import { ActionCreator } from './types'
import { AuthIdentity } from '../state/auth'

export const login = (email: string, password: string): ActionCreator => async (dispatch, getState, services) => {
	dispatch(createAction(SET_LOADING)())
	const { signIn } = await services.tenantClient.request(loginMutation, { email, password }, services.config.loginToken)
	if (signIn.ok) {
		dispatch(
			createAction<AuthIdentity>(SET_IDENTITY, () => ({
				token: signIn.result.token,
				email: signIn.result.person.email,
				projects: signIn.result.person.identity.projects.map((it: any) => it.slug)
			}))()
		)
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
				person {
					email
					identity {
						projects {
							slug
						}
					}
				}
			}
		}
	}
`

export const logout = (): ActionCreator => (dispatch, getState, services) => {
	dispatch(createAction(SET_LOGOUT)())
	dispatch(pushRequest(() => ({ name: 'login' })))
}
