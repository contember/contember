import { SignInIDPErrors, useSignInIDP } from '../../mutations'
import { getBaseHref } from './common'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSetSessionToken } from '@contember/react-client'
import { useIDPStateStore } from './useIDPStateStore'

export type IDPResponseState =
	| { type: 'nothing' }
	| { type: 'processing' }
	| { type: 'succeed' }
	| { type: 'failed', error: HandleIdpResponseError }

export type HandleIdpResponseError =
	| SignInIDPErrors
	| 'INVALID_LOCAL_STATE'

export interface UseHandleIDPResponseProps {
	onLogin?: () => void
	onError?: (error: HandleIdpResponseError) => void
}

export const useHandleIDPResponse = ({ onLogin, onError }: UseHandleIDPResponseProps): IDPResponseState => {
	const idpSignIn = useSignInIDP()
	const setSessionToken = useSetSessionToken()

	const hasOauthResponse = useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		return params.has('state') && (params.has('code') || params.has('id_token'))
	}, [])


	const [state, setState] = useState<IDPResponseState>(() => hasOauthResponse ? { type: 'processing' } : { type: 'nothing' })
	const firstRenderRef = useRef(true)

	const setError = useCallback((err: HandleIdpResponseError) => {
		setState({ type: 'failed', error: err })
		onError?.(err)
	}, [onError])
	const { get: loadIdpState } = useIDPStateStore()

	useEffect(() => {
		if (!hasOauthResponse || !firstRenderRef.current) {
			return
		}
		firstRenderRef.current = false
		;(async () => {
			const idpState = loadIdpState()
			if (!idpState) {
				setError('INVALID_LOCAL_STATE')
				return
			}

			const response = await idpSignIn({
				url: window.location.href,
				redirectUrl: getBaseHref(),
				session: idpState.sessionData,
				identityProvider: idpState.provider,
				expiration: 3600 * 24 * 14,
			})
			if (!response.ok) {
				setError(response.error.code)
			} else {
				setSessionToken(response.result.token)
				setState({ type: 'succeed' })

				onLogin?.()
			}
		})()
	}, [idpSignIn, onLogin, setSessionToken, hasOauthResponse, onError, setError, loadIdpState])

	return state
}
