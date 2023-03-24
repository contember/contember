import { getBaseHref, IDP } from './common'
import { useCallback } from 'react'
import { useInitSignInIDP } from '../../mutations'
import { useIDPStateStore } from './useIDPStateStore'
import { useSaveBacklink } from '../person'

export interface UseInitIDPRedirectProps {
	onError: (message: string) => void
}

export const useInitIDPRedirect = ({ onError }: UseInitIDPRedirectProps) => {
	const initRequest = useInitSignInIDP()
	const saveBacklink = useSaveBacklink()
	const { set: saveIdpState }  = useIDPStateStore()

	return useCallback(async ({ provider }: IDP) => {
		const response = await initRequest({
			redirectUrl: getBaseHref(),
			identityProvider: provider,
		})

		if (!response.ok) {
			console.error(response.error)
			onError('Failed to initiate login.')

		} else {
			saveIdpState({ provider, sessionData: response.result.sessionData })
			saveBacklink()

			window.location.href = response.result.authUrl
		}

	}, [initRequest, onError, saveBacklink, saveIdpState])
}
