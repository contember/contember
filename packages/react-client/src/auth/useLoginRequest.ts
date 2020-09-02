import { loginMutation, LoginMutationResponse } from '@contember/client'
import * as React from 'react'
import { ApiRequestState } from '../apiRequest'
import { useLoginToken } from '../config'
import { useTenantApiRequest } from '../tenant'
import { invokeIfSupportsCredentials } from './invokeIfSupportsCredentials'

export const useLoginRequest = (): [
	ApiRequestState<LoginMutationResponse>,
	(email: string, password: string) => void,
] => {
	const [requestState, sendRequest] = useTenantApiRequest<LoginMutationResponse>()
	const loginToken = useLoginToken()

	const login = React.useCallback(
		(email: string, password: string) => {
			sendRequest(
				loginMutation,
				{
					email,
					password,
					expiration: 3600 * 24 * 14, // Two weeks
				},
				loginToken,
			).then(async () => {
				invokeIfSupportsCredentials(async () => {
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
			})
		},
		[sendRequest, loginToken],
	)

	React.useEffect(() => {
		invokeIfSupportsCredentials(async () => {
			const credentials = await navigator.credentials.get({
				password: true,
				mediation: 'silent',
			})
			if (credentials instanceof PasswordCredential && credentials.password) {
				login(credentials.id, credentials.password)
			}
		})
	}, [login])

	return [requestState, login]
}
