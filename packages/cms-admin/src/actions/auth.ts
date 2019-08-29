import { createAction } from 'redux-actions'
import { SET_ERROR, SET_IDENTITY, SET_LOADING, SET_LOGOUT } from '../reducer/auth'
import { pushRequest } from './request'
import { ActionCreator } from './types'
import { AuthIdentity } from '../state/auth'
import { invokeIfSupportsCredentials } from '../utils/invokeIfSupportsCredentials'

export const login = (email: string, password: string, rememberMe: boolean): ActionCreator => async (
	dispatch,
	getState,
	services,
) => {
	dispatch(createAction(SET_LOADING)())
	try {
		const { signIn } = await services.tenantClient.request(
			loginMutation,
			{
				email,
				password,
				expiration: rememberMe ? 3600 * 24 * 14 : undefined,
			},
			services.config.loginToken,
		)
		if (signIn.ok) {
			await invokeIfSupportsCredentials(async () => {
				const credentials = await navigator.credentials.create({
					password: {
						password,
						id: email,
					},
				})
				if (credentials) {
					await navigator.credentials.store(credentials)
				}
			})
			dispatch(
				createAction<AuthIdentity>(SET_IDENTITY, () => ({
					token: signIn.result.token,
					email: signIn.result.person.email,
					projects: signIn.result.person.identity.projects.map((project: any) => ({
						...project,
						roles: new Set(project.roles),
					})),
				}))(),
			)
			dispatch(pushRequest(() => ({ name: 'projects_list' })))
		} else {
			dispatch(
				createAction(SET_ERROR, () => signIn.errors.map((err: any) => err.endUserMessage || err.code).join(', '))(),
			)
		}
	} catch (error) {
		console.error(error.message)
		dispatch(createAction(SET_ERROR, () => 'Something went wrong')())
	}
}

export const tryAutoLogin = (): ActionCreator => async dispatch => {
	await invokeIfSupportsCredentials(async () => {
		const credentials = await navigator.credentials.get({
			password: true,
			mediation: 'silent',
		})
		if (credentials instanceof PasswordCredential && credentials.password) {
			dispatch(login(credentials.id, credentials.password, false))
		}
	})
}

const loginMutation = `
	mutation($email: String!, $password: String!, $expiration: Int) {
		signIn(email: $email, password: $password, expiration: $expiration) {
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
							roles
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
