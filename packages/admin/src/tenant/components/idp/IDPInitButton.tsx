import { Button } from '@contember/ui'
import { useCallback, useEffect, useMemo } from 'react'
import { useInitSignInIDP } from '../../mutations'
import { getBaseHref, IDP, IDP_BACKLINK, IDP_CODE, IDP_SESSION_KEY } from './common'

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
			localStorage.setItem(IDP_BACKLINK, window.location.href)
			window.location.href = response.result.authUrl
		}
	}, [initRequest, onError])

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const backlink = params.get('backlink')

		if (backlink !== null) {
			const resolvedBacklink = new URL(backlink, window.location.href)
			const idp = resolvedBacklink.searchParams.get('idp')

			if (idp !== null && idp === provider.provider) {
				onInitIDP(provider.provider)
			}
		}
	}, [provider, onInitIDP])

	return (
		<Button onClick={() => onInitIDP(provider.provider)}>Login using {provider.name ?? provider.provider}</Button>
	)
}
