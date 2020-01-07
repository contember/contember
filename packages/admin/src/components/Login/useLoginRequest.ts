import * as React from 'react'
import { ApiClientError, useClientConfig, useTenantApiRequest } from '../../apiClient'
import { ApiRequestState } from '../../apiClient/apiRequest/ApiRequestState'
import { invokeIfSupportsCredentials } from '../../utils/invokeIfSupportsCredentials'
import { loginMutation } from './loginMutation'

export const useLoginRequest = (): [ApiRequestState<any>, (email: string, password: string) => void] => {
	const [requestState, sendRequest] = useTenantApiRequest<any>()
	const config = useClientConfig()

	if (config === undefined) {
		throw new ApiClientError('Config is undefined. Perhaps you forgot about ConfigContext?')
	}

	const loginToken = config.loginToken

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
