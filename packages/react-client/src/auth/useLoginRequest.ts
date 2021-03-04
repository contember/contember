import { loginMutation, LoginMutationResponse } from '@contember/client'
import { useCallback } from 'react'
import { ApiRequestState } from '../apiRequest'
import { useLoginToken } from '../config'
import { useTenantApiRequest } from '../tenant'

export const useLoginRequest = (): [
	ApiRequestState<LoginMutationResponse>,
	(email: string, password: string) => Promise<LoginMutationResponse>,
] => {
	const [requestState, sendRequest] = useTenantApiRequest<LoginMutationResponse>()
	const loginToken = useLoginToken()

	const login = useCallback(
		(email: string, password: string) =>
			sendRequest(
				loginMutation,
				{
					email,
					password,
					expiration: 3600 * 24 * 14, // Two weeks
				},
				{ apiTokenOverride: loginToken },
			),
		[sendRequest, loginToken],
	)

	return [requestState, login]
}
