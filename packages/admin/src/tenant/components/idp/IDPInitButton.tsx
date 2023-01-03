import { Button } from '@contember/ui'
import { useEffect } from 'react'
import { IDP } from './common'
import { useInitIDPRedirect } from './useInitIDPRedirect'

export interface IDPInitButtonProps {
	provider: IDP,
	onError: (message: string) => void
}

export const IDPInitButton = ({ provider, onError }: IDPInitButtonProps) => {
	const onInitIDP = useInitIDPRedirect({ onError })

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const backlink = params.get('backlink')

		if (backlink !== null) {
			const resolvedBacklink = new URL(backlink, window.location.href)
			const idp = resolvedBacklink.searchParams.get('idp')

			if (idp !== null && idp === provider.provider) {
				onInitIDP(provider)
			}
		}
	}, [provider, onInitIDP])

	return (
		<Button onClick={() => onInitIDP(provider)}>Login using {provider.name ?? provider.provider}</Button>
	)
}
