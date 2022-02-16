import { Button } from '@contember/ui'
import { useCallback } from 'react'
import { useInitSignInIDP } from '../../mutations'
import { getBaseHref, IDP, IDP_CODE, IDP_SESSION_KEY } from './common'

export interface IDPInitButtonProps {
	provider: IDP,
	onError: (message: string) => void
}

export const IDPInitButton = ({ provider, onError }: IDPInitButtonProps) => {
	const initRequest = useInitSignInIDP()
	const onInitIDP = useCallback(async (provider: string) => {
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
			window.location.href = response.result.authUrl
		}
	}, [initRequest, onError])

	return (
		<Button onClick={() => onInitIDP(provider.provider)}>Login using {provider.name ?? provider.provider}</Button>
	)
}
