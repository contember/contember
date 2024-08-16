import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { IDPMethodsContextProvider, IDPStateContextProvider } from '../../contexts'
import { IDPInitError, IDPResponseError, IDPStateValue } from '../../types/idp'
import { useHandleIDPResponse } from '../../internal/hooks/useHandleIDPResponse'
import { useIDPAutoInitProvider } from '../../internal/hooks/useIDPAutoInit'
import { useInitIDPRedirect } from '../../internal/hooks/useInitIDPRedirect'

export interface IDPProps {
	children: ReactNode
	onLogin?: () => void
	onInitError?: (error: IDPInitError) => void
	onResponseError?: (error: IDPResponseError) => void
}

export const IDP = ({ children, onResponseError, onInitError, onLogin }: IDPProps) => {
	const hasOauthResponse = useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		return params.has('state') && (params.has('code') || params.has('id_token'))
	}, [])

	const autoInit = useIDPAutoInitProvider()
	const [state, setState] = useState<IDPStateValue>(() => {
		if (hasOauthResponse) {
			return { type: 'processing_response' }
		}
		if (autoInit) {
			return { type: 'processing_init' }
		}
		return { type: 'nothing' }
	})
	useHandleIDPResponse({ hasOauthResponse, setState, onLogin })

	const initRedirect = useInitIDPRedirect({ setState })

	const isFirstRender = useRef(true)
	useEffect(() => {
		if (!autoInit) {
			return
		}
		if (!isFirstRender.current) {
			return
		}
		isFirstRender.current = false
		initRedirect({ provider: autoInit })
	}, [autoInit, initRedirect])

	useEffect(() => {
		if (state.type === 'init_failed' && onInitError) {
			onInitError(state.error)
		}
		if (state.type === 'response_failed' && onResponseError) {
			onResponseError(state.error)
		}
	}, [onInitError, onResponseError, state])


	return (
		<IDPStateContextProvider.Provider value={state}>
			<IDPMethodsContextProvider.Provider value={{ initRedirect }}>
				{children}
			</IDPMethodsContextProvider.Provider>
		</IDPStateContextProvider.Provider>
	)

}
