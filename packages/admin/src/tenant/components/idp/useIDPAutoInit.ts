import { useCallback, useEffect, useMemo, useState } from 'react'
import { IDP } from './common'
import { useInitIDPRedirect, UseInitIDPRedirectProps } from './useInitIDPRedirect'

export interface UseIDPAutoInitProps {
	providers: readonly IDP[]
	onError?: UseInitIDPRedirectProps['onError']
}

export type IDPAutoInitState =
	| {
		type: 'nothing'
	}
	| {
		type: 'processing'
	}
	| {
		type: 'failed'
		error: string
	}

export const useIDPAutoInit = ({ onError, providers }: UseIDPAutoInitProps): IDPAutoInitState => {

	const idp = useMemo(() => {
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
	}, [])

	const [idpState, setIdpState] = useState<IDPAutoInitState>(idp ? { type: 'processing' } : { type: 'nothing' })
	const onInitIDP = useInitIDPRedirect({ onError })

	useEffect(() => {
		if (!idp) {
			return
		}

		const provider = providers.find(it => it.provider === idp)
		if (provider) {
			(async () => {
				const result = await onInitIDP(provider)
				if (!result.ok) {
					setIdpState({ type: 'failed', error: result.error })
				}
			})()
		} else {
			const error = `Undefined IdP ${idp}`
			onError?.(error)
			setIdpState({ type: 'failed', error })
		}

	}, [idp, onError, onInitIDP, providers])

	return idpState
}
