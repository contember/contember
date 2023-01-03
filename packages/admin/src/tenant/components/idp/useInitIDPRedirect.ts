import { getBaseHref, IDP, IDP_BACKLINK, IDP_CODE, IDP_SESSION_KEY } from './common'
import { useCallback } from 'react'
import { useInitSignInIDP } from '../../mutations'

export interface UseInitIDPRedirectProps {
	onError: (message: string) => void
}

export const useInitIDPRedirect = ({ onError }: UseInitIDPRedirectProps) => {
	const initRequest = useInitSignInIDP()

	return useCallback(async ({ provider }: IDP) => {
		const response = await initRequest({
			redirectUrl: getBaseHref(),
			identityProvider: provider,
		})

		if (!response.ok) {
			console.error(response.error)
			onError('Failed to initiate login.')

		} else {
			localStorage.setItem(IDP_SESSION_KEY, JSON.stringify(response.result.sessionData))
			localStorage.setItem(IDP_CODE, provider)
			localStorage.setItem(IDP_BACKLINK, window.location.href)
			window.location.href = response.result.authUrl
		}

	}, [initRequest, onError])
}
