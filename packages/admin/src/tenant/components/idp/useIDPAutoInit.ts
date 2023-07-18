import { useEffect } from 'react'
import { IDP } from './common'
import { useInitIDPRedirect, UseInitIDPRedirectProps } from './useInitIDPRedirect'

export interface UseIDPAutoInitProps {
	providers: readonly IDP[]
	onError: UseInitIDPRedirectProps['onError']
}

export const useIDPAutoInit = ({ onError, providers }: UseIDPAutoInitProps) => {
	const onInitIDP = useInitIDPRedirect({ onError })

	useEffect(() => {
		const idp = (() => {
			const params = new URLSearchParams(window.location.search)
			const idp = params.get('idp')
			if (idp !== null) {
				return idp
			}
			const backlink = params.get('backlink')

			if (backlink !== null) {
				const resolvedBacklink = new URL(backlink, window.location.href)
				return resolvedBacklink.searchParams.get('idp')
			}
		})()

		if (!idp) {
			return
		}

		const provider = providers.find(it => it.provider === idp)
		if (provider) {
			onInitIDP(provider)
		} else {
			onError(`Undefined IdP ${idp}`)
		}

	}, [onError, onInitIDP, providers])
}
